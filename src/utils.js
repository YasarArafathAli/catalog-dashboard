const date = new Date();
export const today = formatDate(date);

export function formatDate(date) {
  let year = date.getFullYear();
  let month = String(date.getMonth() + 1).padStart(2, '0');
  let day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDateXDaysAgo(days) {
  const newDate = new Date();
  newDate.setDate(date.getDate() - days);
  return formatDate(newDate);
}
