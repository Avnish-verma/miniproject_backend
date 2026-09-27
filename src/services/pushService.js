const webpush = require('web-push');
const env = require('../config/env');
const PushSubscription = require('../models/PushSubscription');
const logger = require('../utils/logger');

// Initialize Web Push VAPID configuration
if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      env.VAPID_SUBJECT,
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY
    );
    logger.info('[PushService] Web Push VAPID details configured successfully');
  } catch (err) {
    logger.error(`[PushService] Failed to set VAPID details: ${err.message}`);
  }
}

class PushService {
  getVapidPublicKey() {
    return env.VAPID_PUBLIC_KEY;
  }

  getPublicKey() {
    return this.getVapidPublicKey();
  }

  async subscribe(userId, subscriptionData, userAgent = '') {
    if (!subscriptionData || !subscriptionData.endpoint || !subscriptionData.keys) {
      throw new Error('Invalid subscription data structure');
    }

    const { endpoint, keys } = subscriptionData;

    const saved = await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        user: userId,
        endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
        userAgent: userAgent || '',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    logger.debug(`[PushService] Registered push subscription for user ${userId}`);
    return saved;
  }

  async unsubscribe(endpoint) {
    if (!endpoint) return false;
    await PushSubscription.deleteOne({ endpoint });
    return true;
  }

  async sendToUser(userId, payload) {
    try {
      const subscriptions = await PushSubscription.find({ user: userId });
      if (!subscriptions || subscriptions.length === 0) {
        return { delivered: 0, total: 0 };
      }

      const stringPayload = JSON.stringify({
        title: payload.title || 'ShiftAura',
        body: payload.body || 'New activity on ShiftAura',
        icon: payload.icon || '/icon-192.png',
        badge: payload.badge || '/badge-96.png',
        tag: payload.tag || 'shiftaura-general',
        data: payload.data || {},
        vibrate: payload.vibrate || [100, 50, 100],
        actions: payload.actions || [],
        requireInteraction: payload.requireInteraction || false,
      });

      let delivered = 0;
      const expiredEndpoints = [];

      await Promise.all(
        subscriptions.map(async (sub) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.keys.p256dh,
                  auth: sub.keys.auth,
                },
              },
              stringPayload,
              {
                TTL: 60 * 60 * 24, // 24 hours
                urgency: payload.urgency || 'normal', // 'high' for incoming calls
              }
            );
            delivered++;
          } catch (err) {
            // If subscription has expired or is unsubscribed (404 or 410 Gone)
            if (err.statusCode === 404 || err.statusCode === 410) {
              expiredEndpoints.push(sub.endpoint);
            } else {
              logger.warn(`[PushService] Failed delivery to ${sub.endpoint.substring(0, 30)}...: ${err.message}`);
            }
          }
        })
      );

      // Clean up stale subscriptions automatically
      if (expiredEndpoints.length > 0) {
        await PushSubscription.deleteMany({ endpoint: { $in: expiredEndpoints } });
        logger.debug(`[PushService] Cleaned up ${expiredEndpoints.length} expired push subscriptions`);
      }

      return { delivered, total: subscriptions.length };
    } catch (err) {
      logger.error(`[PushService] Error sending push to user ${userId}: ${err.message}`);
      return { delivered: 0, total: 0, error: err.message };
    }
  }
}

module.exports = new PushService();
