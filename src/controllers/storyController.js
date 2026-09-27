const storyService = require('../services/storyService');
const HTTP_STATUS = require('../constants/httpStatusCodes');

class StoryController {
  async createStory(req, res, next) {
    try {
      const story = await storyService.createStory(req.user._id, req.body);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Story published successfully',
        data: story,
      });
    } catch (error) {
      next(error);
    }
  }

  async getFeedStories(req, res, next) {
    try {
      const currentUserId = req.user ? req.user._id : null;
      const groups = await storyService.getFeedStories(currentUserId);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: groups,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStoryById(req, res, next) {
    try {
      const { storyId } = req.params;
      const currentUserId = req.user ? req.user._id : null;
      const story = await storyService.getStoryById(storyId, currentUserId);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: story,
      });
    } catch (error) {
      next(error);
    }
  }

  async recordStoryView(req, res, next) {
    try {
      const { storyId } = req.params;
      const result = await storyService.recordStoryView(storyId, req.user._id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStoryViewers(req, res, next) {
    try {
      const { storyId } = req.params;
      const result = await storyService.getStoryViewers(storyId, req.user._id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.viewers,
        total: result.viewsCount,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteStory(req, res, next) {
    try {
      const { storyId } = req.params;
      const result = await storyService.deleteStory(storyId, req.user._id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StoryController();
