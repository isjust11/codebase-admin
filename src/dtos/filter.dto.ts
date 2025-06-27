export interface PaginationParams {
    page?: number;
    size?: number;
    search?: string;
  }
  
 export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
  }
  