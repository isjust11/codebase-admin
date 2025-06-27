export enum QuestionType {
  /** Chọn một đáp án đúng */
  CHOOSE_SINGLE_ANSWER = 'CHOOSE_SINGLE_ANSWER',
  /** Chọn nhiều đáp án đúng */
  CHOOSE_MULTIPLE_ANSWERS = 'CHOOSE_MULTIPLE_ANSWERS',
  /** Điền vào chỗ trống */
  FILL_IN_THE_BLANK = 'FILL_IN_THE_BLANK',
  /** Nối các cặp tương ứng */
  MATCHING = 'MATCHING',
  /** Sắp xếp các mục theo đúng thứ tự */
  ORDERING = 'ORDERING',
  /** Trả lời câu hỏi ngắn */
  SHORT_ANSWER = 'SHORT_ANSWER',
  /** Viết một bài luận */
  ESSAY = 'ESSAY',
  /** Mô tả một hình ảnh */
  IMAGE_DESCRIPTION = 'IMAGE_DESCRIPTION',
  /** Ghi âm câu trả lời cho câu hỏi nói */
  VOICE_RECORDING = 'VOICE_RECORDING',
}
  