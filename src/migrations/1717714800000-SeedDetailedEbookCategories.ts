import { MigrationInterface, QueryRunner } from 'typeorm';
import { CategoryTypeEnum } from 'src/enums/category-type.enum';
import { CategoryCodeEnum } from 'src/enums/category-code.enum';

export class SeedDetailedEbookCategories1717714800000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const categoryColumns = await queryRunner.query(`SHOW COLUMNS FROM category`);
        const existingColumns = new Set(
            categoryColumns.map((column: { Field?: string }) => column?.Field).filter(Boolean)
        );
        const hasColumn = (columnName: string): boolean => existingColumns.has(columnName);

        const buildUpsertPayload = (category: {
            name: string;
            nameEN: string;
            description: string;
            descriptionEN: string;
            icon: string;
            iconType: string;
            color: string;
            sortOrder: number;
        }) => {
            const assignments: string[] = [];
            const insertColumns: string[] = [];
            const values: Array<string | number | null> = [];

            const appendColumn = (columnName: string, value: string | number | null) => {
                if (!hasColumn(columnName)) {
                    return;
                }
                assignments.push(`${columnName} = ?`);
                insertColumns.push(columnName);
                values.push(value);
            };

            appendColumn('name', category.name);
            appendColumn('nameEN', category.nameEN);
            appendColumn('description', category.description);
            appendColumn('descriptionEN', category.descriptionEN);
            appendColumn('icon', category.icon);
            appendColumn('iconType', category.iconType);
            appendColumn('color', category.color);
            appendColumn('sortOrder', category.sortOrder);
            appendColumn('categoryTypeId', null);

            return {
                assignments,
                insertColumns,
                values,
            };
        };

        // Lấy category type ID cho BOOK_CATEGORY
        const bookCategoryTypeResult = await queryRunner.query(
            `SELECT id FROM category_type WHERE code = ?`,
            [CategoryTypeEnum.BOOK_CATEGORY]
        );

        if (!bookCategoryTypeResult || bookCategoryTypeResult.length === 0) {
            throw new Error(`CategoryType with code ${CategoryTypeEnum.BOOK_CATEGORY} not found!`);
        }

        const categoryTypeId = bookCategoryTypeResult[0].id;

        // Định nghĩa các danh mục cần seed
        const categories = [
            // --- CẤP CHA ---
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_FICTION,
                name: 'Văn học & Tiểu thuyết',
                nameEN: 'Fiction',
                description: 'Tiểu thuyết, truyện ngắn và tác phẩm văn học sáng tạo khác.',
                descriptionEN: 'Novels, stories, and other creative writing.',
                icon: 'book-open',
                iconType: 'lucide',
                color: '#E11D48',
                sortOrder: 1,
                parentCode: null
            },
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_NON_FICTION,
                name: 'Phi hư cấu & Đời sống',
                nameEN: 'Non-Fiction',
                description: 'Sách kiến thức, giáo dục, thông tin thực tế và khoa học.',
                descriptionEN: 'Informative, educational, and factual writings.',
                icon: 'brain-circuit',
                iconType: 'lucide',
                color: '#2563EB',
                sortOrder: 2,
                parentCode: null
            },
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_CHILDREN,
                name: 'Sách Thiếu nhi',
                nameEN: "Children's Books",
                description: 'Sách tranh, truyện cổ tích và giáo dục kỹ năng cho trẻ em.',
                descriptionEN: "Books for children, picture books, and fairy tales.",
                icon: 'baby',
                iconType: 'lucide',
                color: '#16A34A',
                sortOrder: 3,
                parentCode: null
            },
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_TEEN,
                name: 'Tuổi mới lớn',
                nameEN: 'Young Adult',
                description: 'Văn học và kỹ năng dành riêng cho lứa tuổi thanh thiếu niên.',
                descriptionEN: 'Fiction and life skills for young adults and teenagers.',
                icon: 'users',
                iconType: 'lucide',
                color: '#84CC16',
                sortOrder: 4,
                parentCode: null
            },
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_EDUCATION,
                name: 'Giáo dục & Học thuật',
                nameEN: 'Education & Academic',
                description: 'Sách giáo khoa, giáo trình học tập, ngoại ngữ và tin học.',
                descriptionEN: 'Textbooks, learning materials, programming, and references.',
                icon: 'graduation-cap',
                iconType: 'lucide',
                color: '#4F46E5',
                sortOrder: 5,
                parentCode: null
            },
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_LIFESTYLE,
                name: 'Nghệ thuật & Đời sống',
                nameEN: 'Arts & Lifestyle',
                description: 'Sách về ẩm thực, du lịch, phong cách sống và nghệ thuật.',
                descriptionEN: 'Books on cooking, travel, hobbies, and art.',
                icon: 'palmtree',
                iconType: 'lucide',
                color: '#CA8A04',
                sortOrder: 6,
                parentCode: null
            },

            // --- CẤP CON CỦA FICTION ---
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_ROMANCE,
                name: 'Lãng mạn & Tình cảm',
                nameEN: 'Romance',
                description: 'Câu chuyện tình yêu lãng mạn, ngọt ngào và đầy cảm xúc.',
                descriptionEN: 'Romantic stories, love, and emotional journeys.',
                icon: 'heart',
                iconType: 'lucide',
                color: '#F43F5E',
                sortOrder: 1,
                parentCode: CategoryCodeEnum.BOOK_CATEGORY_FICTION
            },
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_FANTASY,
                name: 'Kỳ ảo & Huyền bí',
                nameEN: 'Fantasy',
                description: 'Thế giới phép thuật, thần thoại và những cuộc phiêu lưu giả tưởng.',
                descriptionEN: 'Magic, mythical creatures, and epic imaginary worlds.',
                icon: 'wand-2',
                iconType: 'lucide',
                color: '#8B5CF6',
                sortOrder: 2,
                parentCode: CategoryCodeEnum.BOOK_CATEGORY_FICTION
            },
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_SCIFI,
                name: 'Khoa học Viễn tưởng',
                nameEN: 'Science Fiction',
                description: 'Công nghệ tương lai, du hành vũ trụ và vũ trụ song song.',
                descriptionEN: 'Future technology, space travel, and parallel universes.',
                icon: 'rocket',
                iconType: 'lucide',
                color: '#3B82F6',
                sortOrder: 3,
                parentCode: CategoryCodeEnum.BOOK_CATEGORY_FICTION
            },
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_MYSTERY,
                name: 'Trinh thám & Giật gân',
                nameEN: 'Mystery & Thriller',
                description: 'Những vụ án ly kỳ, giải mã bí ẩn và những màn đấu trí kịch tính.',
                descriptionEN: 'Crime solving, suspenseful plots, and psychological thrillers.',
                icon: 'shield-alert',
                iconType: 'lucide',
                color: '#1E293B',
                sortOrder: 4,
                parentCode: CategoryCodeEnum.BOOK_CATEGORY_FICTION
            },
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_HISTORICAL_FICTION,
                name: 'Tiểu thuyết Lịch sử',
                nameEN: 'Historical Fiction',
                description: 'Những câu chuyện giả tưởng lồng ghép trong bối cảnh lịch sử có thật.',
                descriptionEN: 'Fictional stories set in real historical periods.',
                icon: 'scroll',
                iconType: 'lucide',
                color: '#D97706',
                sortOrder: 5,
                parentCode: CategoryCodeEnum.BOOK_CATEGORY_FICTION
            },
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_CLASSICS,
                name: 'Văn học Kinh điển',
                nameEN: 'Classics',
                description: 'Những tác phẩm văn học xuất sắc vượt thời gian.',
                descriptionEN: 'Timeless masterpieces of world and national literature.',
                icon: 'library',
                iconType: 'lucide',
                color: '#6B7280',
                sortOrder: 6,
                parentCode: CategoryCodeEnum.BOOK_CATEGORY_FICTION
            },

            // --- CẤP CON CỦA NON-FICTION ---
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_SELF_HELP,
                name: 'Phát triển bản thân',
                nameEN: 'Self-Help',
                description: 'Rèn luyện kỹ năng, tư duy tích cực và thay đổi thói quen.',
                descriptionEN: 'Skills, positive mindset, habits, and self-improvement.',
                icon: 'trending-up',
                iconType: 'lucide',
                color: '#059669',
                sortOrder: 1,
                parentCode: CategoryCodeEnum.BOOK_CATEGORY_NON_FICTION
            },
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_BUSINESS,
                name: 'Kinh doanh & Đầu tư',
                nameEN: 'Business & Economics',
                description: 'Quản trị khởi nghiệp, marketing, đầu tư tài chính và kinh tế vĩ mô.',
                descriptionEN: 'Startups, marketing, finance, investing, and macroeconomics.',
                icon: 'briefcase',
                iconType: 'lucide',
                color: '#0D9488',
                sortOrder: 2,
                parentCode: CategoryCodeEnum.BOOK_CATEGORY_NON_FICTION
            },
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_BIOGRAPHY,
                name: 'Tiểu sử & Hồi ký',
                nameEN: 'Biographies & Memoirs',
                description: 'Câu chuyện cuộc đời của những vĩ nhân và nhân vật tầm cỡ.',
                descriptionEN: 'Life stories of influential leaders, creators, and historical figures.',
                icon: 'user',
                iconType: 'lucide',
                color: '#4F46E5',
                sortOrder: 3,
                parentCode: CategoryCodeEnum.BOOK_CATEGORY_NON_FICTION
            },
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_HISTORY,
                name: 'Lịch sử',
                nameEN: 'History',
                description: 'Khám phá tiến trình lịch sử nhân loại và lịch sử Việt Nam.',
                descriptionEN: 'Exploration of world history and national events.',
                icon: 'landmark',
                iconType: 'lucide',
                color: '#78350F',
                sortOrder: 4,
                parentCode: CategoryCodeEnum.BOOK_CATEGORY_NON_FICTION
            },
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_SCIENCE,
                name: 'Khoa học & Công nghệ',
                nameEN: 'Science & Technology',
                description: 'Vũ trụ học, sinh học, vật lý và các xu hướng công nghệ mới.',
                descriptionEN: 'Cosmology, biology, physics, and new tech trends.',
                icon: 'atom',
                iconType: 'lucide',
                color: '#0EA5E9',
                sortOrder: 5,
                parentCode: CategoryCodeEnum.BOOK_CATEGORY_NON_FICTION
            },
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_PHILOSOPHY,
                name: 'Triết học & Tâm lý học',
                nameEN: 'Philosophy & Psychology',
                description: 'Những tư tưởng triết học lớn và nghiên cứu hành vi, tâm lý con người.',
                descriptionEN: 'Great philosophical thoughts and studies on human behavior.',
                icon: 'compass',
                iconType: 'lucide',
                color: '#6366F1',
                sortOrder: 6,
                parentCode: CategoryCodeEnum.BOOK_CATEGORY_NON_FICTION
            },

            // --- CẤP CON CỦA CHILDREN ---
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_CHILDREN_PICTURE,
                name: 'Sách tranh & Truyện đọc',
                nameEN: 'Picture Books',
                description: 'Sách nhiều hình ảnh sinh động giúp phát triển trí tưởng tượng cho trẻ.',
                descriptionEN: 'Colorful and interactive books to spark kids imagination.',
                icon: 'image',
                iconType: 'lucide',
                color: '#10B981',
                sortOrder: 1,
                parentCode: CategoryCodeEnum.BOOK_CATEGORY_CHILDREN
            },
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_CHILDREN_FAIRY,
                name: 'Truyện cổ tích & Thần thoại',
                nameEN: 'Fairy Tales',
                description: 'Thế giới cổ tích dân gian, truyền thuyết và thần thoại kỳ ảo.',
                descriptionEN: 'Folk tales, legends, and magical mythologies.',
                icon: 'sparkles',
                iconType: 'lucide',
                color: '#34D399',
                sortOrder: 2,
                parentCode: CategoryCodeEnum.BOOK_CATEGORY_CHILDREN
            },
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_CHILDREN_EDUCATION,
                name: 'Giáo dục kỹ năng trẻ',
                nameEN: 'Kids Education',
                description: 'Sách học chữ, số, khoa học vui và rèn luyện nhân cách cho trẻ.',
                descriptionEN: 'Learning letters, numbers, fun science, and manners.',
                icon: 'graduation-cap',
                iconType: 'lucide',
                color: '#059669',
                sortOrder: 3,
                parentCode: CategoryCodeEnum.BOOK_CATEGORY_CHILDREN
            },

            // --- CẤP CON CỦA TEEN ---
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_TEEN_FICTION,
                name: 'Văn học tuổi Teen',
                nameEN: 'Teen Fiction',
                description: 'Truyện học trò, tình bạn và những thử thách đầu đời.',
                descriptionEN: 'Stories of school life, friendship, and early life challenges.',
                icon: 'smile',
                iconType: 'lucide',
                color: '#A3E635',
                sortOrder: 1,
                parentCode: CategoryCodeEnum.BOOK_CATEGORY_TEEN
            },
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_TEEN_SKILLS,
                name: 'Kỹ năng & Hướng nghiệp',
                nameEN: 'Teen Skills & Guidance',
                description: 'Sách trang bị kỹ năng sống và tư vấn hướng nghiệp cho học sinh.',
                descriptionEN: 'Life skills and career advice for high school students.',
                icon: 'compass',
                iconType: 'lucide',
                color: '#65A30D',
                sortOrder: 2,
                parentCode: CategoryCodeEnum.BOOK_CATEGORY_TEEN
            },

            // --- CẤP CON CỦA EDUCATION ---
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_LANGUAGES,
                name: 'Học Ngoại ngữ',
                nameEN: 'Language Learning',
                description: 'Giáo trình, từ vựng, ngữ pháp tiếng Anh, Nhật, Trung, Hàn...',
                descriptionEN: 'Textbooks and practice for English, Japanese, Chinese, etc.',
                icon: 'languages',
                iconType: 'lucide',
                color: '#EA580C',
                sortOrder: 1,
                parentCode: CategoryCodeEnum.BOOK_CATEGORY_EDUCATION
            },
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_IT,
                name: 'Tin học & Lập trình',
                nameEN: 'IT & Programming',
                description: 'Sách hướng dẫn lập trình, khoa học máy tính và công nghệ thông tin.',
                descriptionEN: 'Guides on coding, computer science, and software engineering.',
                icon: 'terminal',
                iconType: 'lucide',
                color: '#0F172A',
                sortOrder: 2,
                parentCode: CategoryCodeEnum.BOOK_CATEGORY_EDUCATION
            },
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_ACADEMIC,
                name: 'Giáo trình & Tra cứu',
                nameEN: 'Academic & Reference',
                description: 'Sách chuyên ngành, giáo trình đại học và từ điển tra cứu.',
                descriptionEN: 'Academic textbooks, university materials, and reference books.',
                icon: 'search',
                iconType: 'lucide',
                color: '#4F46E5',
                sortOrder: 3,
                parentCode: CategoryCodeEnum.BOOK_CATEGORY_EDUCATION
            },

            // --- CẤP CON CỦA LIFESTYLE ---
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_COOKING,
                name: 'Ẩm thực & Nấu ăn',
                nameEN: 'Cooking & Food',
                description: 'Công thức nấu ăn, làm bánh và pha chế thức uống từ các đầu chef.',
                descriptionEN: 'Recipes, baking, and drink-making guides.',
                icon: 'soup',
                iconType: 'lucide',
                color: '#F97316',
                sortOrder: 1,
                parentCode: CategoryCodeEnum.BOOK_CATEGORY_LIFESTYLE
            },
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_TRAVEL,
                name: 'Du lịch & Khám phá',
                nameEN: 'Travel & Adventure',
                description: 'Cẩm nang du lịch, ký sự đường xa và hành trình khám phá thế giới.',
                descriptionEN: 'Travel guides, road stories, and world exploration memoirs.',
                icon: 'map',
                iconType: 'lucide',
                color: '#06B6D4',
                sortOrder: 2,
                parentCode: CategoryCodeEnum.BOOK_CATEGORY_LIFESTYLE
            },
            {
                code: CategoryCodeEnum.BOOK_CATEGORY_PARENTING,
                name: 'Nuôi dạy con & Gia đình',
                nameEN: 'Parenting & Family',
                description: 'Kinh nghiệm nuôi con khỏe, dạy con ngoan và giữ gìn hạnh phúc gia đình.',
                descriptionEN: 'Childcare, parenting tips, and family happiness guides.',
                icon: 'heart-handshake',
                iconType: 'lucide',
                color: '#EC4899',
                sortOrder: 3,
                parentCode: CategoryCodeEnum.BOOK_CATEGORY_LIFESTYLE
            }
        ];

        // 1. Chèn hoặc cập nhật các danh mục CHA trước (các danh mục có parentCode là null)
        const parentCategories = categories.filter(c => !c.parentCode);
        for (const parent of parentCategories) {
            const existing = await queryRunner.query(
                `SELECT id FROM category WHERE code = ?`,
                [parent.code]
            );

            if (existing && existing.length > 0) {
                const payload = buildUpsertPayload(parent);
                await queryRunner.query(
                    `UPDATE category 
                     SET ${payload.assignments.join(', ')}
                     WHERE code = ?`,
                    [...payload.values.map(value => value === null ? categoryTypeId : value), parent.code]
                );
            } else {
                const payload = buildUpsertPayload(parent);
                await queryRunner.query(
                    `INSERT INTO category (${payload.insertColumns.join(', ')}, code, isActive, allowEdit, isDefault)
                     VALUES (${payload.insertColumns.map(() => '?').join(', ')}, ?, true, true, false)`,
                    [...payload.values.map(value => value === null ? categoryTypeId : value), parent.code]
                );
            }
        }

        // 2. Chèn hoặc cập nhật các danh mục CON (các danh mục có parentCode khác null)
        const childCategories = categories.filter(c => c.parentCode);
        for (const child of childCategories) {
            // Lấy ID của danh mục cha
            const parentResult = await queryRunner.query(
                `SELECT id FROM category WHERE code = ?`,
                [child.parentCode]
            );

            if (!parentResult || parentResult.length === 0) {
                console.warn(`Parent category with code ${child.parentCode} not found for child ${child.code}`);
                continue;
            }

            const parentId = parentResult[0].id;

            const existing = await queryRunner.query(
                `SELECT id FROM category WHERE code = ?`,
                [child.code]
            );

            if (existing && existing.length > 0) {
                const payload = buildUpsertPayload(child);
                const updateAssignments = hasColumn('parentId')
                    ? `${payload.assignments.join(', ')}, parentId = ?`
                    : payload.assignments.join(', ');
                const updateValues = payload.values.map(value => value === null ? categoryTypeId : value);
                if (hasColumn('parentId')) {
                    updateValues.push(parentId);
                }
                await queryRunner.query(
                    `UPDATE category 
                     SET ${updateAssignments}
                     WHERE code = ?`,
                    [...updateValues, child.code]
                );
            } else {
                const payload = buildUpsertPayload(child);
                const insertColumns = hasColumn('parentId')
                    ? [...payload.insertColumns, 'parentId']
                    : payload.insertColumns;
                const insertValues = payload.values.map(value => value === null ? categoryTypeId : value);
                if (hasColumn('parentId')) {
                    insertValues.push(parentId);
                }
                await queryRunner.query(
                    `INSERT INTO category (${insertColumns.join(', ')}, code, isActive, allowEdit, isDefault)
                     VALUES (${insertColumns.map(() => '?').join(', ')}, ?, true, true, false)`,
                    [...insertValues, child.code]
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Danh sách codes được thêm mới hoàn toàn (chưa có ở migration trước)
        const newCodes = [
            CategoryCodeEnum.BOOK_CATEGORY_EDUCATION,
            CategoryCodeEnum.BOOK_CATEGORY_LIFESTYLE,
            CategoryCodeEnum.BOOK_CATEGORY_ROMANCE,
            CategoryCodeEnum.BOOK_CATEGORY_FANTASY,
            CategoryCodeEnum.BOOK_CATEGORY_SCIFI,
            CategoryCodeEnum.BOOK_CATEGORY_MYSTERY,
            CategoryCodeEnum.BOOK_CATEGORY_HISTORICAL_FICTION,
            CategoryCodeEnum.BOOK_CATEGORY_CLASSICS,
            CategoryCodeEnum.BOOK_CATEGORY_SELF_HELP,
            CategoryCodeEnum.BOOK_CATEGORY_BUSINESS,
            CategoryCodeEnum.BOOK_CATEGORY_BIOGRAPHY,
            CategoryCodeEnum.BOOK_CATEGORY_HISTORY,
            CategoryCodeEnum.BOOK_CATEGORY_SCIENCE,
            CategoryCodeEnum.BOOK_CATEGORY_PHILOSOPHY,
            CategoryCodeEnum.BOOK_CATEGORY_CHILDREN_PICTURE,
            CategoryCodeEnum.BOOK_CATEGORY_CHILDREN_FAIRY,
            CategoryCodeEnum.BOOK_CATEGORY_CHILDREN_EDUCATION,
            CategoryCodeEnum.BOOK_CATEGORY_TEEN_FICTION,
            CategoryCodeEnum.BOOK_CATEGORY_TEEN_SKILLS,
            CategoryCodeEnum.BOOK_CATEGORY_LANGUAGES,
            CategoryCodeEnum.BOOK_CATEGORY_IT,
            CategoryCodeEnum.BOOK_CATEGORY_ACADEMIC,
            CategoryCodeEnum.BOOK_CATEGORY_COOKING,
            CategoryCodeEnum.BOOK_CATEGORY_TRAVEL,
            CategoryCodeEnum.BOOK_CATEGORY_PARENTING
        ];

        // Xóa các danh mục con trước để tránh lỗi khóa ngoại parentId
        await queryRunner.query(
            `DELETE FROM category WHERE code IN (?) AND parentId IS NOT NULL`,
            [newCodes]
        );

        // Xóa các danh mục cha mới thêm
        await queryRunner.query(
            `DELETE FROM category WHERE code IN (?)`,
            [newCodes]
        );
    }
}
