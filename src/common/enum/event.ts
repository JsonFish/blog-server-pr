export enum SocketEvents {
  // 消息相关事件
  MessageSend = 'message:send', // 用户发送消息
  MessageRevoke = 'message:revoke', // 用户撤回消息
  MessageDeliveryConfirmation = 'message:delivery:confirmation', // 发送者接收消息已成功发送的确认
  MessageReceptionByReceiver = 'message:reception:byReceiver', // 接收者收到新消息
  MessageRevocationBroadcast = 'message:revocation:broadcast', // 通知所有聊天成员消息已被撤回
  MessageRevocationConfirmationToSender = 'message:revocation:confirmation:toSender', // 撤回消息后通知发送者成功撤回

  // 聊天记录相关事件
  ChatRequestHistory = 'chat:request:history', // 请求获取聊天历史
  ChatHistoryResponse = 'chat:response:history', // 返回聊天历史记录

  // 用户操作相关事件
  UserFollowNotification = 'user:notification:follow', // 用户关注通知
  UserLikeNotification = 'user:notification:like', // 用户点赞通知
  UserCommentNotification = 'user:notification:comment', // 用户评论通知
  UserFavoriteNotification = 'user:notification:favorite', // 用户收藏通知

  // 错误相关事件
  ErrorResponse = 'error:response', // 错误响应

  LikeNotification = 'like:notification', // 点赞通知

  // 评论事件
  CommentAdd = 'comment:add', // 添加评论
  CommentEdit = 'comment:edit', // 编辑评论
  CommentDelete = 'comment:delete', // 删除评论
  CommentNotification = 'comment:notification', // 评论通知

  // 收藏事件
  FavoriteAdd = 'favorite:add', // 添加收藏
  FavoriteRemove = 'favorite:remove', // 移除收藏
  FavoriteNotification = 'favorite:notification', // 收藏通知

  MarkNotificationsAsRead = 'MarkNotificationsAsRead',
  UnreadCounts = 'unreadCounts',
  FetchUnreadCounts = 'fetchUnreadCounts',
}

export enum NotificationType {
  COMMENT_LIKE = 'COMMENT_LIKE', // 评论点赞
  ARTICLE_LIKE = 'ARTICLE_LIKE', // 文章点赞
  ARTICLE_COMMENT = 'ARTICLE_COMMENT', // 文章评论
  COMMENT_COMMENT = 'COMMENT_COMMENT', // 评论的回复
  FOLLOW = 'FOLLOW', // 关注
  OFFICIAL = 'OFFICIAL', // 官方通知
  ARTICLE_FAVORITE = 'ARTICLE_FAVORITE', // 文章收藏
  SYSTEM = 'SYSTEM', // 系统通知
}
