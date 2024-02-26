import {
  isEqual,
  isFuture,
  intlFormatDistance,
  format,
  differenceInDays,
  parseISO,
  isThisWeek,
  isThisMonth,
} from "date-fns";

export function capitalizeFirstLetter(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}
  
export function lowercaseFirstLetter(word) {
    return word.charAt(0).toLowerCase() + word.slice(1);
}

export function formatDate(date) {
  // See 'date-fns' JavaScript library documentation for more information regarding the methods used within this function
  if (!date) return "";

  const today = () => differenceInDays(parseISO(date), new Date()) < 1;

  if (today()) {
    return intlFormatDistance(parseISO(date), new Date(), { unit: "day" });
  }

  const thisWeek = () =>
    differenceInDays(parseISO(date), new Date()) >= 1 &&
    isThisWeek(parseISO(date), { weekStartsOn: 1 });

  if (thisWeek()) {
    return lowercaseFirstLetter(format(parseISO(date), "EEEE"));
  }

  const thisMonth = () =>
    differenceInDays(parseISO(date), new Date()) >= 1 &&
    !isThisWeek(parseISO(date), { weekStartsOn: 1 }) &&
    isThisMonth(parseISO(date));

  if (thisMonth()) {
    return lowercaseFirstLetter(format(parseISO(date), "E d"));
  }

  if (!isThisMonth(parseISO(date))) {
    return format(parseISO(date), "d MMM");
  }

  return date;
}

export function checkDateInterval(type, dueDate) {
  if (!type || !dueDate) return false;

  const today = new Date();
  // Ensures that date comparisons are not affected by hours, minutes, or seconds
  today.setHours(0, 0, 0, 0);

    // See 'date-fns' JavaScript library documentation for more information regarding the methods used within this function
  if (type === "overdue") {
    return dueDate < today;
  }

  if (type === "today") {
    return isEqual(dueDate, today);
  }

  if (type === "this-week") {
    return (
      (isEqual(dueDate, today) || isFuture(dueDate)) &&
      differenceInDays(dueDate, today) <= 7
    );
  }

  return false;
}

// Scans the todo and calls the passed function with different arguments based on conditional statements
export function scanTodo(todo, fn) {
  const parsedDueDate = parseISO(todo.get("dueDate"));
  // If todo has a dueDate and that dueDate is the current date, run the function with the 'today' argument
  if (todo.get("dueDate") && checkDateInterval("today", parsedDueDate)) {
    fn(todo, "today");
  }

  // If todo has a dueDate and that dueDate is in the following 7 days, run the function with the 'this-week' argument
  if (todo.get("dueDate") && checkDateInterval("this-week", parsedDueDate)) {
    fn(todo, "this-week");
  }

  // If todo has a categoryID, run the function by providing the ID of the category;
  if (todo.get("categoryID")) fn(todo, todo.get("categoryID"));

  // Always run the function by providing the 'all-todos' argument, since the 'All todos' devCategory
  // has no special logic and contains all todos regardless of their properties
  fn(todo, "all-todos");
}
