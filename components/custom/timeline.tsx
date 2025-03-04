import React from 'react';

interface TimelineProps {
    children: React.ReactNode;
}

const Timeline: React.FC<TimelineProps> = ({ children }) => {
    return <div className="timeline">{children}</div>;
};

interface TimelineItemProps {
    time: string;
    children: React.ReactNode;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ time, children }) => {
    return (
        <div className="timeline-item">
            <span className="timeline-time">{new Date(time).toLocaleString()}</span>
            <p className="timeline-message">{children}</p>
        </div>
    );
};

// ✅ Correctly export both components
export { Timeline, TimelineItem };
