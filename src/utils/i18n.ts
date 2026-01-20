export const i18nData = {
	en: {
		agendaNotRunning: 'agenda not running!',
		dbEntryNotFound: 'db entry not found',
		overwritingAlreadyDefined: 'overwriting already defined agenda job: %s',
		errorCreatingJobs: 'createJobs() -> error creating one or more of the jobs',
		errorCreatingNow: 'error trying to create a job for this exact moment',
		startWait: 'Agenda.start called, waiting for agenda to be initialized (db connection)',
		stopCalled: 'Agenda.stop called, clearing interval for processJobs()',
		unlockingJobs: 'about to unlock jobs with ids: %O',
		cancellingJobs: 'attempting to cancel all Agenda jobs',
		cancelledJobs: '%s jobs cancelled',
		purgeCalled: 'Agenda.purge(%o)'
	},
	vi: {
		agendaNotRunning: 'agenda chưa chạy!',
		dbEntryNotFound: 'không tìm thấy mục trong cơ sở dữ liệu',
		overwritingAlreadyDefined: 'ghi đè job đã định nghĩa: %s',
		errorCreatingJobs: 'createJobs() -> lỗi khi tạo một hoặc nhiều job',
		errorCreatingNow: 'lỗi khi cố gắng tạo job chạy ngay lập tức',
		startWait: 'Agenda.start được gọi, đang đợi agenda khởi tạo (kết nối db)',
		stopCalled: 'Agenda.stop được gọi, đang dừng bộ xử lý job',
		unlockingJobs: 'đang mở khóa các job có id: %O',
		cancellingJobs: 'đang cố gắng hủy tất cả các job Agenda',
		cancelledJobs: 'đã hủy %s job',
		purgeCalled: 'Agenda.purge(%o)'
	}
};

export type Language = keyof typeof i18nData;

export function translate(lang: Language, key: keyof typeof i18nData['en']): string {
	const translations = i18nData[lang] || i18nData.vi; // Mặc định là Tiếng Việt như yêu cầu
	return translations[key] || key;
}
