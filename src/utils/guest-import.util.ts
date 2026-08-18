import { BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { GuestDto } from '../dtos/guest.dto';

export type ColumnMapping = {
  name?: string;
  phone?: string;
  email?: string;
  group?: string;
  tableNumber?: string;
  personalMessage?: string;
};

function normalizeHeader(value: string): string {
  return String(value || '').trim().toLowerCase();
}

function pick(row: Record<string, any>, key?: string, fallbacks: string[] = []): any {
  if (key && row[key] !== undefined && row[key] !== '') return row[key];
  for (const fb of fallbacks) {
    const found = Object.keys(row).find((k) => normalizeHeader(k) === fb);
    if (found && row[found] !== undefined && row[found] !== '') return row[found];
  }
  return undefined;
}

export function parseGuestImportFile(file: Express.Multer.File, mapping: ColumnMapping = {}): GuestDto[] {
  if (!file?.buffer) {
    throw new BadRequestException('File is required');
  }
  const workbook = XLSX.read(file.buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new BadRequestException('Empty spreadsheet');
  }
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
  return rows
    .map((row) => {
      const name = pick(row, mapping.name, ['name', 'ten', 'tên', 'ho ten', 'họ tên']);
      if (!name) return null;
      const phone = pick(row, mapping.phone, ['phone', 'sdt', 'sđt', 'so dien thoai', 'số điện thoại']);
      const email = pick(row, mapping.email, ['email']);
      const group = pick(row, mapping.group, ['group', 'nhom', 'nhóm']);
      const tableNumber = pick(row, mapping.tableNumber, ['table', 'ban', 'bàn', 'so ban', 'số bàn']);
      const personalMessage = pick(row, mapping.personalMessage, ['message', 'loi nhan', 'lời nhắn']);
      const extraData: Record<string, any> = {};
      if (tableNumber) extraData.tableNumber = String(tableNumber);
      if (personalMessage) extraData.personalMessage = String(personalMessage);
      return {
        name: String(name),
        phone: phone ? String(phone) : undefined,
        email: email ? String(email) : undefined,
        group: group ? String(group) : undefined,
        extraData,
      } as GuestDto;
    })
    .filter(Boolean) as GuestDto[];
}
