import { Injectable, Inject, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis, { ClientContext, Result } from 'ioredis';

import { ObjectType } from '../types';

import { isObject } from '@/utils';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  onModuleDestroy(): void {
    this.redisClient.disconnect();
  }

  /**
   * @Description: 设置值到redis中
   * @param {string} key
   * @param {any} value
   * @return {*}
   */
  public async set(
    key: string,
    value: unknown,
    second?: number,
  ): Promise<Result<'OK', ClientContext> | null> {
    try {
      const formattedValue = isObject(value) ? JSON.stringify(value) : String(value);

      if (!second) {
        return await this.redisClient.set(key, formattedValue);
      } else {
        return await this.redisClient.set(key, formattedValue, 'EX', second);
      }
    } catch (error) {
      this.logger.error(`Error setting key ${key} in Redis`, error);

      return null;
    }
  }

  /**
   * @Description: 获取redis缓存中的值
   * @param key {String}
   */
  public async get(key: string): Promise<string | null> {
    try {
      const data = await this.redisClient.get(key);

      return data ? data : null;
    } catch (error) {
      this.logger.error(`Error getting key ${key} from Redis`, error);

      return null;
    }
  }

  /**
   * @Description: 设置自动 +1
   * @param {string} key
   * @return {*}
   */
  public async incr(key: string): Promise<Result<number, ClientContext> | null> {
    try {
      return await this.redisClient.incr(key);
    } catch (error) {
      this.logger.error(`Error incrementing key ${key} in Redis`, error);

      return null;
    }
  }

  /**
   * @Description: 删除redis缓存数据
   * @param {string} key
   * @return {*}
   */
  public async del(key: string): Promise<Result<number, ClientContext> | null> {
    try {
      return await this.redisClient.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key ${key} from Redis`, error);

      return null;
    }
  }

  /**
   * @Description: 设置hash结构
   * @param {string} key
   * @param {ObjectType} field
   * @return {*}
   */
  public async hset(key: string, field: ObjectType): Promise<Result<number, ClientContext> | null> {
    try {
      return await this.redisClient.hset(key, field);
    } catch (error) {
      this.logger.error(`Error setting hash for key ${key} in Redis`, error);

      return null;
    }
  }

  /**
   * @Description: 获取单个hash值
   * @param {string} key
   * @param {string} field
   * @return {*}
   */
  public async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.redisClient.hget(key, field);
    } catch (error) {
      this.logger.error(`Error getting hash field ${field} from key ${key} in Redis`, error);

      return null;
    }
  }

  /**
   * @Description: 获取所有hash值
   * @param {string} key
   * @return {*}
   */
  public async hgetall(key: string): Promise<Record<string, string> | null> {
    try {
      return await this.redisClient.hgetall(key);
    } catch (error) {
      this.logger.error(`Error getting all hash fields from key ${key} in Redis`, error);

      return null;
    }
  }

  /**
   * @Description: 清空redis缓存
   * @return {*}
   */
  public async flushall(): Promise<Result<'OK', ClientContext> | null> {
    try {
      return await this.redisClient.flushall();
    } catch (error) {
      this.logger.error('Error flushing all Redis data', error);

      return null;
    }
  }

  /**
   * @Description: 保存离线通知
   * @param {string} userId
   * @param {any} notification
   */
  public async saveOfflineNotification(userId: string, notification: any): Promise<void> {
    try {
      await this.redisClient.lpush(`offline_notifications:${userId}`, JSON.stringify(notification));
    } catch (error) {
      this.logger.error(`Error saving offline notification for user ${userId}`, error);
    }
  }

  /**
   * @Description: 获取离线通知
   * @param {string} userId
   * @return {*}
   */
  public async getOfflineNotifications(userId: string): Promise<any[]> {
    try {
      const notifications = await this.redisClient.lrange(`offline_notifications:${userId}`, 0, -1);
      await this.redisClient.del(`offline_notifications:${userId}`);

      return notifications.map((notification) => JSON.parse(notification));
    } catch (error) {
      this.logger.error(`Error getting offline notifications for user ${userId}`, error);

      return [];
    }
  }

  /**
   * 获取指定 key 的剩余生存时间
   * @param key Redis key
   * @returns 剩余生存时间（秒）
   */
  public async getTTL(key: string): Promise<number> {
    return await this.redisClient.ttl(key);
  }
}
