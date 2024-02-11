import * as Organizer from './organizer.js';
import * as Renderer from './renderer.js';
import { UserCategory } from './category.js';
import { Todo } from './todo.js';
import { isEqual, isFuture, intlFormatDistance, format, differenceInDays, parseISO, isThisWeek, isThisMonth } from 'date-fns';

// Helper functions
function getCurrentSortingMethod() { return Organizer.getCategory(Renderer.getCurrentContentID()).getCurrentSortingMethod() }
function getCurrentFilterMethod() { return Organizer.getCategory(Renderer.getCurrentContentID()).getCurrentFilterMethod() }
export function lowercaseFirstLetter(word) { return word.charAt(0).toLowerCase() + word.slice(1) };
export function capitalizeFirstLetter(word) { return word.charAt(0).toUpperCase() + word.slice(1) };

export function formatDate(date) {

    // See 'date-fns' JavaScript library documentation for more information regarding the methods used within this function
    if (!date) return '';
    if (differenceInDays(parseISO(date), new Date()) < 1) { return intlFormatDistance(parseISO(date), new Date(), { unit: 'day' }) };
    if (differenceInDays(parseISO(date), new Date()) >= 1 && isThisWeek(parseISO(date), { weekStartsOn: 1 })) { return lowercaseFirstLetter(format(parseISO(date), 'EEEE')) };
    if (differenceInDays(parseISO(date), new Date()) >= 1 && !isThisWeek(parseISO(date), { weekStartsOn: 1 }) && isThisMonth(parseISO(date))) { return lowercaseFirstLetter(format(parseISO(date), 'E d')) };
    if (!isThisMonth(parseISO(date))) { return format(parseISO(date), 'd MMM') };

}

function checkDateInterval(type, dueDate) {

    const today = new Date();
    // Ensures that date comparisons are not affected by hours, minutes, or seconds
    today.setHours(0, 0, 0, 0);

    const types = {

        // If dueDate is lower than today...
        'overdue': function () { return format(dueDate, 'MM/dd/yyyy') < format(new Date(), 'MM/dd/yyyy') },
        // If dueDate is equal to today...
        'today': function () { return isEqual(dueDate, today) },
        // If dueDate is equal to today, or todo is in the future and is due within the next 7 days...
        'this-week': function () { return (isEqual(dueDate, today) || isFuture(dueDate)) && differenceInDays(dueDate, today) <= 7 },

    }

    return types[type]();

}