import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReadingProgress } from '../entities/reading-progress.entity';

@Injectable()
export class ReadingProgressService {
  constructor(
    @InjectRepository(ReadingProgress)
    private progressRepository: Repository<ReadingProgress>,
  ) {}

  async saveOrUpdateProgress(
    userId: number,
    bookId: number,
    currentPage: number,
  ): Promise<ReadingProgress> {
    let progress = await this.progressRepository.findOne({
      where: { userId, bookId },
    });

    if (progress) {
      progress.currentPage = currentPage;
      progress.lastReadAt = new Date();
    } else {
      progress = this.progressRepository.create({
        userId,
        bookId,
        currentPage,
        lastReadAt: new Date(),
      });
    }

    return this.progressRepository.save(progress);
  }

  async getProgress(userId: number, bookId: number): Promise<ReadingProgress | null> {
    return this.progressRepository.findOne({
      where: { userId, bookId },
      relations: ['book', 'user'],
    });
  }

  async getUserProgress(userId: number): Promise<ReadingProgress[]> {
    return this.progressRepository.find({
      where: { userId },
      relations: ['book', 'user'],
      order: { lastReadAt: 'DESC' },
    });
  }

  async getUserFinishedBooks(userId: number): Promise<ReadingProgress[]> {
    return this.progressRepository.find({
      where: { userId, isFinished: true },
      relations: ['book', 'user'],
      order: { updatedAt: 'DESC' },
    });
  }

  async updateReadingTime(
    userId: number,
    bookId: number,
    minutes: number,
  ): Promise<ReadingProgress | null> {
    const progress = await this.progressRepository.findOne({
      where: { userId, bookId },
    });

    if (!progress) {
      return null;
    }

    progress.readingTimeMinutes += minutes;
    return this.progressRepository.save(progress);
  }
}

