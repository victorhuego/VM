import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// Read .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx !== -1) {
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
}

const spreadsheetId = env.GOOGLE_SPREADSHEET_ID;
const keyPath = path.join(process.cwd(), env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || 'credentials/service-account.json');
const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

const auth = new google.auth.JWT({
  email: key.client_email,
  key: key.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

console.log('Connecting to Google Spreadsheet:', spreadsheetId);

// 1. Initial Balances
console.log('Seeding InitialBalances...');
await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: 'InitialBalances!A2:F2',
  valueInputOption: 'USER_ENTERED',
  requestBody: {
    values: [[12500000, 20730000, 45000000, 25000000, 60000000, new Date().toISOString()]],
  },
});

// 2. Debts
console.log('Seeding Debts...');
const debts = [
  ['debt-1', 'Trả góp Macbook M3 Pro', 3000000, '2026-09-01', 'Techcombank', 'Kỳ 3/6 tháng', 'active', new Date().toISOString()],
  ['debt-2', 'Dư nợ thẻ tín dụng tháng 8', 1500000, '2026-09-10', 'VPBank', 'Hạn thanh toán 25/09', 'active', new Date().toISOString()],
  ['debt-3', 'Mượn tiền ăn liên hoan', 500000, '2026-09-12', 'Tuấn Anh', 'Chuyển trả qua Momo', 'active', new Date().toISOString()],
];

try {
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'Debts!A2:H100' });
} catch (e) {}

await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: 'Debts!A2:H4',
  valueInputOption: 'USER_ENTERED',
  requestBody: { values: debts },
});

// 3. Moments
console.log('Seeding Moments...');
const moments = [
  [
    'mom-1',
    '2026.09.19 15:30:22',
    '15:30',
    'Hoàn thành bản thiết kế hệ thống tối giản với khả năng chuyển đổi nhiều tông màu (Theme Switcher).',
    'serene',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    '',
    'Google Drive: #img_03',
    new Date().toISOString(),
  ],
  [
    'mom-2',
    '2026.09.19 12:15:00',
    '12:15',
    'Uống một ngụm trà yêu thích và đi dạo 20 phút sau giờ ăn trưa.',
    'wander',
    '',
    '',
    '',
    new Date().toISOString(),
  ],
  [
    'mom-3',
    '2026.09.19 08:00:15',
    '08:00',
    'Khởi đầu ngày mới tràn đầy năng lượng với bình nước ombre yêu thích.',
    'focus',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
    '',
    'Google Drive: #img_01',
    new Date().toISOString(),
  ],
];

try {
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'Moments!A2:I100' });
} catch (e) {}

await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: 'Moments!A2:I4',
  valueInputOption: 'USER_ENTERED',
  requestBody: { values: moments },
});

// 4. Expenses
console.log('Seeding Expenses...');
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

const expenses = [
  ['exp-salary-1', '2026-09-05', 'income', 'salary', 25000000, 'account', '', 'Lương tháng 9/2026', '', '', '', new Date().toISOString()],
  ['exp-1', today, 'expense', 'housing', 6500000, 'account', '', 'Tiền thuê căn hộ tháng 9', '', '', '', new Date().toISOString()],
  ['exp-2', today, 'expense', 'shopping', 4200000, 'account', '', 'Mua bàn nâng hạ Ergonomic', 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=400&q=80', '', '', new Date().toISOString()],
  ['exp-3', today, 'expense', 'shopping', 350000, 'account', '', 'Sách Design Systems & Clean Code', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1000&q=80', '', '', new Date().toISOString()],
  ['exp-4', '2026-09-18', 'expense', 'housing', 1200000, 'account', '', 'Hóa đơn Điện & Nước sinh hoạt', 'https://images.unsplash.com/photo-1554415707-9e49fe830839?auto=format&fit=crop&w=1000&q=80', '', '', new Date().toISOString()],
  ['exp-5', '2026-09-10', 'expense', 'food', 850000, 'account', '', 'Siêu thị thực phẩm hữu cơ tuần 2', 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80', '', '', new Date().toISOString()],
  ['exp-6', '2026-09-08', 'expense', 'transport', 250000, 'cash', '', 'Xăng xe & phí cầu đường', '', '', '', new Date().toISOString()],
  ['exp-7', '2026-09-06', 'expense', 'development', 1800000, 'account', '', 'Khóa học Advanced Next.js & TypeScript', '', '', '', new Date().toISOString()],
  ['exp-8', '2026-09-07', 'expense', 'food', 450000, 'cash', '', 'Cà phê specialty cuối tuần với bạn', '', '', '', new Date().toISOString()],
  ['exp-9', '2026-09-04', 'expense', 'entertainment', 600000, 'cash', '', 'Xem kịch sân khấu & triển lãm tranh', '', '', '', new Date().toISOString()],
  ['exp-bonus-1', '2026-09-01', 'income', 'bonus', 5000000, 'account', '', 'Thưởng dự án Q3 hoàn thành sớm', '', '', '', new Date().toISOString()],
  ['exp-10', '2026-08-15', 'expense', 'food', 4200000, 'cash', '', 'Tiệc liên hoan sinh nhật gia đình', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80', '', '', new Date().toISOString()],
  ['exp-11', '2026-08-01', 'expense', 'housing', 8500000, 'account', '', 'Tiền thuê căn hộ tháng 8', '', '', '', new Date().toISOString()],
  ['exp-12', '2025-12-20', 'expense', 'transport', 3200000, 'cash', '', 'Vé máy bay về quê Tết', '', '', '', new Date().toISOString()],
];

try {
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'Expenses!A2:L100' });
} catch (e) {}

await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: `Expenses!A2:L${expenses.length + 1}`,
  valueInputOption: 'USER_ENTERED',
  requestBody: { values: expenses },
});

console.log('ALL DATA SEEDED SUCCESSFULLY TO GOOGLE SHEETS!');
