import React from 'react'

interface Event {
  type: 'WARNING' | 'DANGER' | 'NORMAL'
  time: string
  description: string
  value: string
}

interface EventsListProps {
  events: Event[]
}

const EventsList: React.FC<EventsListProps> = ({ events }) => {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h5>Recent Events</h5>
        <p>System alerts and detections</p>
      </div>
      <div className="events-list">
        {events.length > 0 ? (
          events.map((event, index) => (
            <div key={index} className="event-item">
              <div className="event-meta">
                <span className={`event-type ${event.type.toLowerCase()}`}>
                  {event.type}
                </span>
                <span className="event-time">{event.time}</span>
              </div>
              <div className="event-description">{event.description}</div>
              <div className="event-value">{event.value}</div>
            </div>
          ))
        ) : (
          <div className="event-item">
            <div className="event-description">No recent events</div>
            <div className="event-value">System is running normally</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EventsList

