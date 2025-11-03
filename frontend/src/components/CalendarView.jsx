import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

const CalendarView = ({ events, onDateClick, onEventClick }) => {
  // Transform events for FullCalendar
  const calendarEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.all_day,
    backgroundColor: event.color,
    borderColor: event.color,
    extendedProps: {
      trigger_type: event.trigger_type,
      target_deployment: event.target_deployment,
      desired_replicas: event.desired_replicas,
      status: event.status
    }
  }));

  return (
    <div data-testid="calendar-view">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        }}
        events={calendarEvents}
        dateClick={onDateClick}
        eventClick={onEventClick}
        editable={false}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        height="auto"
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          meridiem: false
        }}
      />
    </div>
  );
};

export default CalendarView;
