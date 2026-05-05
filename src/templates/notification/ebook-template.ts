import { Book } from "src/entities/book.entity";

export class EbookTemplate {

    static newEbook(book: Book) {
        return {
            title: 'Bạn vừa đăng tải thành công',
            body: 'Bạn vừa đăng tải thành công sách ' + book.title + ' - ' + book.author,
            bodyHtml: 'Bạn vừa đăng tải thành công sách ' + `<b>${book.title}</b> - <i>${book.author}</i>`,
            data: {
                "id": book.id.toString(),
                "type": "ebook"
            }
        }
    }
}