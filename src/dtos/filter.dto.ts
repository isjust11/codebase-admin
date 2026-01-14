export interface PaginationParams {
    page?: number;
    size?: number;
    search?: string;
    mimeType?: string;
    categoryId?: string;
    isRead?: number;
  }
  
 export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
  }
  