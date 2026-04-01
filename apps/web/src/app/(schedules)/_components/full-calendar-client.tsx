"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

import "@/styles/calendar.css";

type FullCalendarClientProps = {
  calendarRef: any;
  events: any[];
  onDateClick: (arg: any) => void;
  onDatesSet: (arg: any) => void;
  onEventClick: (info: any) => void;
  renderEventContent: (eventInfo: any) => React.ReactNode;
};

export function FullCalendarClient({
  calendarRef,
  events,
  onDateClick,
  onDatesSet,
  onEventClick,
  renderEventContent,
}: FullCalendarClientProps) {
  return (
    <FullCalendar
      ref={calendarRef}
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      locale="ko"
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,dayGridWeek",
      }}
      events={events}
      dateClick={onDateClick}
      datesSet={onDatesSet}
      eventClick={onEventClick}
      eventContent={renderEventContent}
      height="100%"
      dayMaxEvents={3}
      selectable
    />
  );
}
