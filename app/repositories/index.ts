export * from './user.repository';
export * from './session.repository';
export * from './article.repository';
export * from './subscription.repository';

// 定义 Repository 接口
// T: 实体类型
// CreateDTO: 创建时所需数据类型，默认为 T 去除系统字段
export interface IRepository<T, CreateDTO = Omit<T, 'id' | 'created_at' | 'updated_at'>> {
    findById(id: number | string): Promise<T | null>;
    create(data: CreateDTO): Promise<T>;
    update(id: number | string, data: Partial<T>): Promise<T | null>;
    delete(id: number | string): Promise<boolean>;
}

export type BaseEntity = {
    id: number;
    created_at: number;
    updated_at?: number;
};
