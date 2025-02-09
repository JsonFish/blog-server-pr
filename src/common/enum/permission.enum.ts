export enum PermissionsEnum {
  // 文章相关权限
  CREATE_ARTICLE = 'CREATE_ARTICLE', // 创建文章
  EDIT_OWN_ARTICLE = 'EDIT_OWN_ARTICLE', // 编辑自己的文章
  DELETE_OWN_ARTICLE = 'DELETE_OWN_ARTICLE', // 删除自己的文章
  COMMENT = 'COMMENT', // 评论
  DELETE_OWN_COMMENT = 'DELETE_OWN_COMMENT', // 删除自己的评论
  DELETE_COMMENT = 'DELETE_COMMENT', // 删除他人评论
  MODERATE_ARTICLE = 'MODERATE_ARTICLE', // 管理文章
  DELETE_COMMENT_IN_OWN_ARTICLE = 'DELETE_COMMENT_IN_OWN_ARTICLE', // 删除他人在自己文章下的评论
  POST_PREMIUM_ARTICLE = 'POST_PREMIUM_ARTICLE', // 发布高级文章
  ACCESS_MEMBER_ONLY_AREA = 'ACCESS_MEMBER_ONLY_AREA', // 访问会员专属区域

  // 系统管理权限
  ADMINISTER = 'ADMINISTER', // 系统管理
  MANAGE_ROLES = 'MANAGE_ROLES', // 管理角色和权限
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS', // 查看审计日志

  // 用户管理权限
  VIEW_USERS = 'VIEW_USERS', // 查看用户列表
  EDIT_USERS = 'EDIT_USERS', // 编辑用户
  DELETE_USERS = 'DELETE_USERS', // 删除用户
  ASSIGN_ROLES = 'ASSIGN_ROLES', // 分配角色
  REMOVE_ROLES = 'REMOVE_ROLES', // 移除角色

  // 动态/静态分离职责控制权限
  ASSIGN_CONFLICT_ROLE = 'ASSIGN_CONFLICT_ROLE', // 分配冲突角色（需要管理员权限）
  ACTIVATE_CONFLICT_SESSION_ROLE = 'ACTIVATE_CONFLICT_SESSION_ROLE', // 会话中激活冲突角色（管理员动态控制权限）

  // 安全和系统设置
  ACCESS_SECURITY_SETTINGS = 'ACCESS_SECURITY_SETTINGS', // 访问安全设置
  MODIFY_SYSTEM_SETTINGS = 'MODIFY_SYSTEM_SETTINGS', // 修改系统设置
}
