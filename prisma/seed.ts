import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始插入分类、标签、角色和权限数据...');

  // 插入分类数据
  const categories = [
    { id: 1, name: '前端', description: '前端技术相关内容' },
    { id: 2, name: '后端', description: '后端技术相关内容' },
    { id: 3, name: 'Android', description: 'Android 开发相关内容' },
    { id: 4, name: 'iOS', description: 'iOS 开发相关内容' },
    { id: 5, name: '人工智能', description: '人工智能领域相关内容' },
    { id: 6, name: '开发工具', description: '各种开发工具的使用技巧' },
    { id: 7, name: '代码人生', description: '编程中的人生故事' },
    { id: 8, name: '阅读', description: '技术阅读与学习心得' },
  ];

  console.log('插入分类数据...');

  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: {}, // 如果已存在，不更新
      create: category,
    });
  }

  // 插入标签数据
  const tags = [
    { id: 1, name: '前端' },
    { id: 2, name: '后端' },
    { id: 3, name: 'JavaScript' },
    { id: 4, name: '面试' },
    { id: 5, name: 'GitHub' },
    { id: 6, name: 'Vue.js' },
    { id: 7, name: 'React.js' },
    { id: 8, name: 'HTML' },
    { id: 9, name: 'Node.js' },
    { id: 10, name: '数据库' },
    { id: 11, name: '程序员' },
    { id: 12, name: '前端框架' },
    { id: 13, name: '设计模式' },
    { id: 14, name: '架构' },
    { id: 15, name: 'Java' },
    { id: 16, name: '算法' },
    { id: 17, name: 'CSS' },
    { id: 18, name: '代码规范' },
    { id: 19, name: 'Android' },
    { id: 20, name: 'Linux' },
    { id: 21, name: '微信小程序' },
    { id: 22, name: 'Python' },
    { id: 23, name: 'MySQL' },
    { id: 24, name: 'Git' },
    { id: 25, name: '人工智能' },
    { id: 26, name: '开源' },
    { id: 27, name: 'Webpack' },
    { id: 28, name: '设计' },
  ];

  console.log('插入标签数据...');

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { id: tag.id },
      update: {}, // 如果已存在，不更新
      create: tag,
    });
  }

  // 插入角色数据
  const roles = [
    { id: 1, name: 'USER', description: '普通用户' },
    { id: 2, name: 'MEMBER', description: '会员' },
    { id: 3, name: 'MODERATOR', description: '版主' },
    { id: 4, name: 'ADMIN', description: '管理员' },
    { id: 5, name: 'SUPER_ADMIN', description: '超级管理员' },
  ];

  console.log('插入角色数据...');

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: {},
      create: role,
    });
  }

  // 插入权限数据
  const permissions = [
    { id: 1, name: 'CREATE_ARTICLE', description: '创建文章' },
    { id: 2, name: 'EDIT_OWN_ARTICLE', description: '编辑自己的文章' },
    { id: 3, name: 'DELETE_OWN_ARTICLE', description: '删除自己的文章' },
    { id: 4, name: 'COMMENT', description: '评论' },
    { id: 5, name: 'DELETE_OWN_COMMENT', description: '删除自己的评论' },
    { id: 6, name: 'DELETE_COMMENT', description: '删除他人评论' },
    { id: 7, name: 'MODERATE_ARTICLE', description: '管理文章' },
    { id: 8, name: 'ADMINISTER', description: '系统管理' },
    { id: 9, name: 'DELETE_COMMENT_IN_OWN_ARTICLE', description: '删除他人在自己文章下的评论' },
    { id: 10, name: 'POST_PREMIUM_ARTICLE', description: '发布高级文章' },
    { id: 11, name: 'ACCESS_MEMBER_ONLY_AREA', description: '访问会员专属区域' },
  ];

  console.log('插入权限数据...');

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { id: permission.id },
      update: {},
      create: permission,
    });
  }

  // 配置角色权限
  const rolePermissions = [
    { roleId: 1, permissionId: 1 },
    { roleId: 1, permissionId: 2 },
    { roleId: 1, permissionId: 3 },
    { roleId: 1, permissionId: 4 },
    { roleId: 1, permissionId: 5 },
    { roleId: 1, permissionId: 9 },
    { roleId: 2, permissionId: 10 },
    { roleId: 2, permissionId: 11 },
    { roleId: 3, permissionId: 7 },
    { roleId: 4, permissionId: 8 },
    { roleId: 5, permissionId: 6 },
  ];

  console.log('插入角色权限数据...');

  for (const rp of rolePermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: rp.roleId, permissionId: rp.permissionId } },
      update: {},
      create: rp,
    });
  }

  // 设置角色继承关系
  const roleHierarchies = [
    { parentRoleId: 1, childRoleId: 2 }, // USER -> MEMBER
    { parentRoleId: 2, childRoleId: 3 }, // MEMBER -> MODERATOR
    { parentRoleId: 3, childRoleId: 4 }, // MODERATOR -> ADMIN
    { parentRoleId: 4, childRoleId: 5 }, // ADMIN -> SUPER_ADMIN
  ];

  console.log('插入角色继承关系...');

  for (const hierarchy of roleHierarchies) {
    await prisma.roleHierarchy.upsert({
      where: {
        parentRoleId_childRoleId: {
          parentRoleId: hierarchy.parentRoleId,
          childRoleId: hierarchy.childRoleId,
        },
      },
      update: {},
      create: hierarchy,
    });
  }

  console.log('分类、标签、角色和权限数据插入完成！');
}

main()
  .catch((error) => {
    console.error('插入数据时出错：', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
