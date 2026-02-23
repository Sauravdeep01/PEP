import './Widgets.css';

function Widgets({ confessions = [], onSearch }) {
    // 1. DYNAMIC TOPICS: Get categories that actually have posts
    const categoryCounts = confessions.reduce((acc, c) => {
        const cat = c.category || 'General';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {});

    const topics = Object.keys(categoryCounts)
        .sort((a, b) => categoryCounts[b] - categoryCounts[a])
        .slice(0, 6)
        .map(cat => `#${cat.toLowerCase().replace(/\s+/g, '_')}`);

    // If no posts yet, show some defaults so it doesn't look empty
    const displayTopics = topics.length > 0 ? topics : ['#welcome', '#first_post', '#anonymous'];

    // 2. DYNAMIC MOOD: Calculate based on reaction types
    const moodStats = confessions.reduce((acc, c) => {
        (c.reactions || []).forEach(r => {
            if (r.type === 'love') acc.happy++;
            if (r.type === 'laugh') acc.funny++;
            if (r.type === 'like') acc.chill++;
        });
        // Also count categories for "Stressed"
        if (c.category === 'Study Stress' || c.category === 'Rant') acc.stressed++;
        return acc;
    }, { stressed: 0, happy: 0, funny: 0, chill: 0 });

    const totalMoodPoints = moodStats.stressed + moodStats.happy + moodStats.funny + moodStats.chill || 1;
    const getPercent = (val) => Math.round((val / totalMoodPoints) * 100);

    return (
        <aside className="widgets-sidebar">
            {/* Hot Topics (Dynamic) */}
            <div className="widget-card">
                <div className="widget-header">
                    <span className="widget-icon">🔥</span>
                    <h3 className="widget-title">Hot Topics</h3>
                </div>
                <div className="topics-cloud">
                    {displayTopics.map(topic => (
                        <span
                            key={topic}
                            className="topic-tag"
                            onClick={() => onSearch && onSearch(topic)}
                            style={{ cursor: 'pointer' }}
                        >
                            {topic}
                        </span>
                    ))}
                </div>
            </div>

            {/* Community Mood (Dynamic) */}
            <div className="widget-card">
                <div className="widget-header">
                    <span className="widget-icon">📊</span>
                    <h3 className="widget-title">Community Mood</h3>
                </div>
                <div className="mood-stats">
                    <div className="mood-item">
                        <div className="mood-info">
                            <span className="mood-label">Stressed</span>
                            <span className="mood-percentage">{getPercent(moodStats.stressed)}%</span>
                        </div>
                        <div className="mood-bar-bg">
                            <div className="mood-bar-fill stressed" style={{ width: `${getPercent(moodStats.stressed)}%` }}></div>
                        </div>
                    </div>
                    <div className="mood-item">
                        <div className="mood-info">
                            <span className="mood-label">Happy</span>
                            <span className="mood-percentage">{getPercent(moodStats.happy)}%</span>
                        </div>
                        <div className="mood-bar-bg">
                            <div className="mood-bar-fill happy" style={{ width: `${getPercent(moodStats.happy)}%` }}></div>
                        </div>
                    </div>
                    <div className="mood-item">
                        <div className="mood-info">
                            <span className="mood-label">Funny/Chill</span>
                            <span className="mood-percentage">{getPercent(moodStats.funny + moodStats.chill)}%</span>
                        </div>
                        <div className="mood-bar-bg">
                            <div className="mood-bar-fill sleepy" style={{ width: `${getPercent(moodStats.funny + moodStats.chill)}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}

export default Widgets;
