export interface ApiResponse<T = any> {
  success: boolean;
  isSuccess?: boolean;
  message: string;
  data: T | null;
  errors: string[];
}
