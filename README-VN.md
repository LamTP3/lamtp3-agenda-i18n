# Agenda

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/agenda/agenda@master/agenda.svg" alt="Agenda" width="100" height="100">
</p>

<p align="center">
  Thư viện lập lịch công việc nhẹ nhàng cho Node.js
</p>

Đây ban đầu là một bản fork của agenda.js, nó khác với phiên bản gốc ở các điểm sau:

- Viết lại hoàn toàn bằng TypeScript (được định kiểu đầy đủ!)
- Sử dụng driver mongodb4 (hỗ trợ MongoDB 5.x)
- Hỗ trợ mongoDB sharding theo tên
- Hàm `touch()` có thêm tham số `progress` tùy chọn (0-100)
- Sửa lỗi và cải thiện việc khóa & xử lý job (concurrency, lockLimit,...)
- **Thay đổi quan trọng (Breaking change):** Tham số cấu hình của hàm `define()` chuyển từ vị trí thứ 2 sang vị trí thứ 3.
- Bổ sung hàm `getRunningStats()`
- Tự động đợi Agenda kết nối trước khi thực hiện bất kỳ thao tác database nào.
- Sử dụng lớp trừu tượng database phía sau.
- **Hỗ trợ đa ngôn ngữ (i18n):** Hỗ trợ Tiếng Việt và Tiếng Anh cho các thông báo hệ thống và lỗi.
- Mặc định không tạo database index, bạn có thể đặt `ensureIndex: true` khi khởi tạo Agenda hoặc chạy thủ công:

```javascript
db.agendaJobs.ensureIndex(
	{
		name: 1,
		nextRunAt: 1,
		priority: -1,
		lockedAt: 1,
		disabled: 1
	},
	'findAndLockNextJobIndex'
);
```

# Agenda cung cấp:

- Sự tối giản. Agenda hướng tới việc giữ cho mã nguồn nhỏ gọn.
- Lớp lưu trữ sử dụng MongoDB.
- API dựa trên Promises.
- Lập lịch với mức độ ưu tiên (priority), số lượng xử lý đồng thời (concurrency), lặp lại (repeating) và lưu trữ kết quả job có thể cấu hình.
- Lập lịch qua cron hoặc cú pháp dễ đọc với con người.
- Hàng đợi job dựa trên sự kiện (Event backed) mà bạn có thể hook vào.
- [Agenda-rest](https://github.com/agenda/agenda-rest): API REST độc lập (tùy chọn).
- [Agendash](https://github.com/agenda/agendash): Giao diện web độc lập (tùy chọn).

### So sánh tính năng

| Tính năng                    |      Bull       |   Bee    | Agenda |
| :--------------------------- | :-------------: | :------: | :----: |
| Backend                      |      redis      |  redis   | mongo  |
| Mức độ ưu tiên               |        ✓        |          |   ✓    |
| Xử lý đồng thời              |        ✓        |    ✓     |   ✓    |
| Job trì hoãn                 |        ✓        |          |   ✓    |
| Sự kiện toàn cục             |        ✓        |          |   ✓    |
| Rate Limiter                 |        ✓        |          |        |
| Tạm dừng/Tiếp tục            |        ✓        |          |   ✓    |
| Worker Sandboxed             |        ✓        |          |   ✓    |
| Job lặp lại                  |        ✓        |          |   ✓    |
| Thao tác Atomic              |        ✓        |    ✓     |   ~    |
| Lưu trữ bền vững             |        ✓        |    ✓     |   ✓    |
| Giao diện người dùng (UI)    |        ✓        |          |   ✓    |
| REST API                     |                 |          |   ✓    |
| Hàng đợi có khả năng mở rộng |                 |          |   ✓    |
| Hỗ trợ job chạy lâu          |                 |          |   ✓    |
| Tối ưu cho                   | Jobs / Tin nhắn | Tin nhắn |  Jobs  |

# Cài đặt

Cài đặt qua NPM:

```bash
npm install @lamtp3-jobs/agenda-i18n
```

Bạn cũng sẽ cần một cơ sở dữ liệu [Mongo](https://www.mongodb.com/) đang hoạt động (v4+) để kết nối.

# Ví dụ sử dụng

```javascript
const { Agenda } = require('@lamtp3-jobs/agenda-i18n');
const mongoConnectionString = 'mongodb://127.0.0.1/agenda';

const agenda = new Agenda({
	db: { address: mongoConnectionString },
	language: 'vi' // Chọn ngôn ngữ: 'vi' hoặc 'en'
});

// Hoặc ghi đè tên collection mặc định:
// const agenda = new Agenda({db: {address: mongoConnectionString, collection: 'jobCollectionName'}});

// Hoặc thêm các tùy chọn kết nối:
// const agenda = new Agenda({db: {address: mongoConnectionString, collection: 'jobCollectionName', options: {ssl: true}}});

// Hoặc truyền vào một instance MongoClient có sẵn
// const agenda = new Agenda({mongo: myMongoClient});

agenda.define('xóa người dùng cũ', async job => {
	await User.remove({ lastLogIn: { $lt: haiNgayTruoc } });
});

(async function () {
	// IIFE để sử dụng async/await
	await agenda.start();

	await agenda.every('3 minutes', 'xóa người dùng cũ');

	// Hoặc bạn cũng có thể làm như sau:
	await agenda.every('*/3 * * * *', 'xóa người dùng cũ');
})();
```

```javascript
agenda.define(
	'gửi báo cáo email',
	async job => {
		const { to } = job.attrs.data;
		await emailClient.send({
			to,
			from: 'example@example.com',
			subject: 'Email Report',
			body: '...'
		});
	},
	{ priority: 'high', concurrency: 10 }
);

(async function () {
	await agenda.start();
	await agenda.schedule('in 20 minutes', 'gửi báo cáo email', { to: 'admin@example.com' });
})();
```

```javascript
(async function () {
	const weeklyReport = agenda.create('gửi báo cáo email', { to: 'example@example.com' });
	await agenda.start();
	await weeklyReport.repeatEvery('1 week').save();
})();
```

# Tài liệu đầy đủ

Xem thêm tại: https://hokify.github.io/agenda/

Cấu trúc điều khiển cơ bản của Agenda là một thực thể (instance) của agenda. Các thực thể này được ánh xạ tới một collection trong cơ sở dữ liệu và tải các job từ đó.

## Mục lục

- [Cấu hình agenda](#cấu-hình-agenda)
- [Sự kiện Agenda](#sự-kiện-agenda)
- [Định nghĩa bộ xử lý job](#định-nghĩa-bộ-xử-lý-job)
- [Tạo job](#tạo-job)
- [Quản lý job](#quản-lý-job)
- [Bắt đầu bộ xử lý job](#bắt-đầu-bộ-xử-lý-job)
- [Nhiều bộ xử lý job cùng lúc](#nhiều-bộ-xử-lý-job-cùng-lúc)
- [Làm việc thủ công với job](#làm-việc-thủ-công-với-job)
- [Sự kiện hàng đợi Job](#sự-kiện-hàng-đợi-job)
- [Câu hỏi thường gặp](#câu-hỏi-thường-gặp)
- [Cấu trúc dự án mẫu](#cấu-trúc-dự-án-mẫu)
- [Các vấn đề đã biết](#các-vấn-đề-đã-biết)
- [Gỡ lỗi](#gỡ-lỗi)
- [Lời cảm ơn](#lời-cảm-ơn)

## Cấu hình agenda

Tất cả các phương thức cấu hình đều có thể nối chuỗi (chainable), nghĩa là bạn có thể làm như sau:

```javascript
const agenda = new Agenda();
agenda
  .database(...)
  .processEvery('3 minutes')
  ...;
```

Các tùy chọn cấu hình khả thi:

```typescript
{
	name: string; // Tên của queue
	defaultConcurrency: number; // Số lượng xử lý đồng thời mặc định
	processEvery: number; // Tần suất kiểm tra database
	maxConcurrency: number; // Số lượng job tối đa chạy cùng lúc
	defaultLockLimit: number; // Giới hạn khóa mặc định cho mỗi loại job
	lockLimit: number; // Giới hạn khóa tổng quan
	defaultLockLifetime: number; // Thời gian khóa mặc định (ms)
	ensureIndex: boolean; // Tự động tạo index
	sort: SortOptionObject<IJobParameters>; // Cách sắp xếp tìm job
	db: {
		collection: string;
		address: string;
		options: MongoClientOptions;
	},
	mongo: Db; // Sử dụng instance Db có sẵn
	language: 'vi' | 'en' // Ngôn ngữ hệ thống
}
```

### language (tùy chọn)

Sử dụng giá trị `'vi'` hoặc `'en'`. Chỉ định ngôn ngữ cho các thông báo nhật ký (log) và lỗi hệ thống.
Giá trị mặc định là `'vi'`.

Agenda sử dụng [Human Interval](http://github.com/rschmukler/human-interval) để chỉ định các khoảng thời gian. Nó hỗ trợ các đơn vị sau:

`seconds`, `minutes`, `hours`, `days`, `weeks`, `months` (giả định 30 ngày), `years` (giả định 365 ngày).

Ví dụ nâng cao:

```javascript
agenda.processEvery('one minute');
agenda.processEvery('1.5 minutes');
agenda.processEvery('3 days and 4 hours');
agenda.processEvery('3 days, 4 hours and 36 seconds');
```

### database(url, [collectionName], [MongoClientOptions])

Chỉ định cơ sở dữ liệu tại `url` được cung cấp. Nếu không có tên collection, `agendaJobs` sẽ được sử dụng.
Mặc định `useNewUrlParser` và `useUnifiedTopology` được đặt thành `true`.

```javascript
agenda.database('localhost:27017/agenda-test', 'agendaJobs');
```

Bạn cũng có thể chỉ định khi khởi tạo:

```javascript
const agenda = new Agenda({
	db: { address: 'localhost:27017/agenda-test', collection: 'agendaJobs' }
});
```

Agenda sẽ phát ra sự kiện `ready` khi kết nối thành công. Bạn có thể gọi `agenda.start()` mà không cần đợi sự kiện này vì nó được xử lý nội bộ.

### mongo(dbInstance, [collectionName])

Sử dụng một thực thể MongoClient/Db có sẵn. Điều này giúp hợp nhất các kết nối cơ sở dữ liệu.

```javascript
const agenda = new Agenda({ mongo: mongoClientInstance.db('agenda-test') });
```

### name(name)

Đặt trường `lastModifiedBy` thành `name` trong collection jobs. Hữu ích khi bạn có nhiều bộ xử lý job và muốn biết queue nào đã chạy job cuối cùng.

```javascript
const os = require('os');
agenda.name(os.hostname + '-' + process.pid);
```

### processEvery(interval)

Nhận vào một chuỗi `interval` (ví dụ: `3 minutes`). Chỉ định tần suất Agenda truy vấn cơ sở dữ liệu để tìm job cần xử lý. Agenda sử dụng `setTimeout` để đảm bảo job chạy đúng lúc (sai số ~3ms).

Giá trị mặc định là `'5 seconds'`.

### maxConcurrency(number)

Số lượng job tối đa có thể chạy tại bất kỳ thời điểm nào. Mặc định là `20`.

### defaultConcurrency(number)

Số lượng xử lý đồng thời mặc định cho một loại job cụ thể. Mặc định là `5`.

### lockLimit(number)

Số lượng job tối đa có thể bị khóa cùng lúc. Mặc định là `0` (không giới hạn).

### defaultLockLifetime(number)

Thời gian khóa mặc định tính bằng mili giây. Mặc định là 10 phút. Một job sẽ được mở khóa nếu nó hoàn thành trước thời gian này. Khóa giúp đảm bảo nếu job bị crash, nó sẽ được giải phóng sau khi hết thời gian khóa.

### sort(query)

Chỉ định cách sắp xếp để tìm và khóa job tiếp theo. Mặc định là `{ nextRunAt: 1, priority: -1 }` (vào trước ra trước, ưu tiên theo priority).

---

## Sự kiện Agenda

Một thực thể Agenda sẽ phát ra các sự kiện sau:

- `ready`: Khi kết nối thành công và index đã được tạo.
- `error`: Khi quá trình kết nối gặp lỗi.

```javascript
await agenda.start();
```

---

## Định nghĩa bộ xử lý Job

Trước khi sử dụng một job, bạn phải định nghĩa hành vi xử lý của nó.

### define(jobName, fn, [options])

Định nghĩa job với tên `jobName`. Khi job chạy, nó sẽ gọi `fn(job, done)`.

`options` bao gồm:

- `concurrency`: Số lượng job chạy đồng thời tối đa (cho mỗi instance).
- `lockLimit`: Số lượng job bị khóa tối đa.
- `lockLifetime`: Thời gian job bị khóa (ms).
- `priority`: Mức độ ưu tiên (`lowest`, `low`, `normal`, `high`, `highest` hoặc số).
- `shouldSaveResult`: Lưu kết quả của job vào database (mặc định: false).

---

## Tạo Job

### every(interval, name, [data], [options])

Chạy job `name` theo chu kỳ `interval`. `every` tạo ra job kiểu `single`, nghĩa là chỉ có một job duy nhất tồn tại trong database cho khai báo này.

### schedule(when, name, [data])

Lập lịch chạy job `name` một lần duy nhất vào thời điểm `when`.

### now(name, [data])

Chạy job `name` ngay lập tức.

### create(jobName, data)

Tạo một thực thể job nhưng **CHƯA** lưu vào database. Bạn cần gọi `await job.save()`.

---

## Quản lý Job

### jobs(query, sort, limit, skip)

Truy vấn danh sách các job trong cơ sở dữ liệu.

### cancel(query)

Hủy và xóa các job khớp với điều kiện truy vấn.

### purge()

Xóa tất cả các job không còn định nghĩa xử lý trong code. **CẨN THẬN:** Đừng chạy hàm này trước khi bạn định nghĩa xong tất cả các job.

---

## Bắt đầu bộ xử lý job

### start()

Bắt đầu vòng lặp kiểm tra job từ database.

### stop()

Dừng bộ xử lý và mở khóa các job đang chạy. Hữu ích cho việc tắt ứng dụng an toàn (graceful shutdown).

---

## Làm việc thủ công với Job

### repeatEvery(interval, [options])

Chỉ định chu kỳ lặp lại. Các tùy chọn: `timezone`, `skipImmediate`, `startDate`, `endDate`.

### repeatAt(time)

Lặp lại vào một thời điểm cụ thể (VD: `3:30pm`).

### unique(properties, [options])

Đảm bảo chỉ có một instance của job tồn tại dựa trên các thuộc tính nhất định.

### fail(reason)

Đánh dấu job thất bại với lý do cụ thể.

### touch()

Làm mới khóa (lock) của job. Hữu ích cho các job chạy rất lâu để báo cho Agenda biết job vẫn đang hoạt động.

---

## Sự kiện hàng đợi Job

- `start`: Trước khi một job bắt đầu.
- `complete`: Khi job kết thúc (thành công hoặc thất bại).
- `success`: Khi job hoàn thành thành công.
- `fail`: Khi job gặp lỗi.

---

## Câu hỏi thường gặp (FAQ)

### Thứ tự chạy job là gì?

Ưu tiên theo `priority`, sau đó đến thời gian lập lịch (`nextRunAt`).

### Khác biệt giữa `lockLimit` và `maxConcurrency`?

`lockLimit` giới hạn số lượng job bị Agenda "giữ" từ DB. `maxConcurrency` giới hạn số lượng job thực sự đang thực thi trong code của bạn.

---

## Gỡ lỗi (Debugging)

Để bật log chi tiết, hãy đặt biến môi trường `DEBUG`:

- Windows PowerShell: `$env:DEBUG = "agenda:*"`
- Linux/macOS: `DEBUG="agenda:*" npm start`

---

## Lời cảm ơn

- Agenda được tạo bởi [@rschmukler](https://github.com/rschmukler).
- [Agendash](https://github.com/agenda/agendash) được tạo bởi [@joeframbach](https://github.com/joeframbach).

## Giấy phép

[MIT License](LICENSE.md)
