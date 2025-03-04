import React from "react";

interface TimelineProps {
    children: React.ReactNode;
}

const Timeline: React.FC<TimelineProps> = ({ children }) => {
    return (
        <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-4 top-0 w-1 bg-gray-300 h-full rounded-lg"></div>
            <div className="space-y-6 pl-10">{children}</div>
        </div>
    );
};

interface TimelineItemProps {
    time: string;
    children: React.ReactNode;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ time, children }) => {
    return (
        <div className="relative flex items-start gap-4">
            {/* Dot */}
            <div className="w-4 h-4 bg-blue-500 rounded-full border-4 border-white shadow-md absolute left-3"></div>

            {/* Timeline Box */}
            <div className="bg-[#fafafa] shadow-md px-5 py-3 rounded-lg border border-gray-200 w-full ml-4 relative">
                {/* Colored Circle Inside Box */}
                <div className="absolute top-4 left-[-10px] w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md"></div>

                <span className="text-xs text-gray-500 font-medium block">
                    {new Date(time).toLocaleString()}
                </span>
                <p className="text-gray-800">{children}</p>
            </div>
        </div>
    );
};

// ✅ Export both components
export { Timeline, TimelineItem };
