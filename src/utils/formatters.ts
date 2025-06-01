export const formatDate = (date: Date): string => {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // difference in seconds
  
  if (diff < 60) {
    return 'только что';
  } else if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    return `${minutes} ${pluralize(minutes, 'минуту', 'минуты', 'минут')} назад`;
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} ${pluralize(hours, 'час', 'часа', 'часов')} назад`;
  } else if (diff < 604800) {
    const days = Math.floor(diff / 86400);
    return `${days} ${pluralize(days, 'день', 'дня', 'дней')} назад`;
  } else {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }
};

export const pluralize = (count: number, one: string, few: string, many: string): string => {
  if (count % 10 === 1 && count % 100 !== 11) {
    return one;
  } else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    return few;
  } else {
    return many;
  }
};

export const formatCurrency = (amount: number): string => {
  return `${amount} кр.`;
};