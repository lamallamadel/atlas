export const Calendar = {
    requestPermissions: async () => ({ calendar: 'granted' }),
    checkPermissions: async () => ({ calendar: 'granted' }),
    createEvent: async () => ({ id: '1' }),
    listEventsInRange: async () => ({ events: [] }),
    listCalendars: async () => ({ calendars: [] }),
    createCalendar: async () => ({ id: '1' }),
    deleteEvent: async () => { },
    deleteCalendar: async () => { }
};
export type CalendarEvent = any;
export type CalendarEventOptions = any;
export type CalendarEventResponse = any;
export type CalendarOptions = any;
