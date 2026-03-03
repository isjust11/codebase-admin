import { InteractionType } from 'src/enums/interaction-type.enum';

interface InteractionNotification {
  title: string;
  body: string;
  data: Record<string, string>;
}

export class InteractionTemplate {
  static forBookOwner(
    interactionType: InteractionType,
    actorName: string,
    bookTitle: string,
    bookId: number,
    extra?: { rating?: number; comment?: string },
  ): InteractionNotification | null {
    const data = { id: bookId.toString(), type: 'ebook', interactionType };

    switch (interactionType) {
      case InteractionType.LIKE:
        return {
          title: 'Có người thích sách của bạn',
          body: `<b>${actorName}</b> đã thích sách <b>${bookTitle}</b>`,
          data,
        };

      case InteractionType.BOOKMARK:
        return {
          title: 'Có người lưu sách của bạn',
          body: `<b>${actorName}</b> đã lưu sách <b>${bookTitle}</b>`,
          data,
        };

      case InteractionType.FAVORITE:
        return {
          title: 'Có người yêu thích sách của bạn',
          body: `<b>${actorName}</b> đã yêu thích sách <b>${bookTitle}</b>`,
          data,
        };

      case InteractionType.SHARE:
        return {
          title: 'Sách của bạn được chia sẻ',
          body: `<b>${actorName}</b> đã chia sẻ sách <b>${bookTitle}</b>`,
          data,
        };

      case InteractionType.DOWNLOAD:
        return {
          title: 'Có người tải sách của bạn',
          body: `<b>${actorName}</b> đã tải sách <b>${bookTitle}</b>`,
          data,
        };

      case InteractionType.RATING:
        const stars = extra?.rating ? ` ${extra.rating}⭐` : '';
        const commentPart = extra?.comment ? `: "${extra.comment}"` : '';
        return {
          title: 'Có đánh giá mới cho sách của bạn',
          body: `<b>${actorName}</b> đã đánh giá${stars} sách <b>${bookTitle}</b>${commentPart}`,
          data,
        };

      case InteractionType.FOLLOW:
        return {
          title: 'Có người theo dõi sách của bạn',
          body: `<b>${actorName}</b> đã theo dõi sách <b>${bookTitle}</b>`,
          data,
        };

      default:
        return null;
    }
  }

  static newCommentForOtherReviewers(
    actorName: string,
    bookTitle: string,
    bookId: number,
    comment?: string,
  ): InteractionNotification {
    const preview = comment && comment.length > 80
      ? comment.substring(0, 80) + '...'
      : (comment ?? '');
    return {
      title: 'Có bình luận mới',
      body: `<b>${actorName}</b> đã bình luận về sách <b>${bookTitle}</b>${preview ? `: "${preview}"` : ''}`,
      data: { id: bookId.toString(), type: 'ebook', interactionType: InteractionType.RATING },
    };
  }
}
