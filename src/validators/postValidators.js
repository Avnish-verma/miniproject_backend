const { z } = require('zod');

const createPostSchema = z.object({
  caption: z.string().max(2200).optional().default(''),
  description: z.string().max(5000).optional().default(''),
  postUrl: z.string().optional().default(''),
  public_id: z.string().optional().default(''),
  media: z
    .array(
      z.object({
        url: z.string().url(),
        public_id: z.string().optional().default(''),
        mediaType: z.enum(['image', 'video']).default('image'),
      })
    )
    .optional(),
  hashtags: z.array(z.string()).optional(),
});

const commentSchema = z.object({
  text: z.string().min(1, 'Comment text cannot be empty').max(1000),
  parentCommentId: z.string().optional().nullable(),
});

const reactionSchema = z.object({
  type: z.enum(['LIKE', 'LOVE', 'FIRE', 'INSIGHT', 'CLAP']).default('LIKE'),
});

module.exports = {
  createPostSchema,
  commentSchema,
  reactionSchema,
};
