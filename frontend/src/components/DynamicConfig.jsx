// DateMe/frontend/src/components/DynamicConfig.jsx
import React, { useEffect, useState } from 'react';

const DynamicConfig = () => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/admin/settings');
                
                if (response.ok) {
                    const data = await response.json();
                    setConfig(data);
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (err) {
                console.error('❌ Config load failed:', err.message);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadConfig();
    }, []);

    if (loading) return null; // Config loads on mount, no need for loading state in UI

    return config ? (
        <React.Fragment>
            {/* Theme Color - Apply globally */}
            <style>{`
                :root {
                    --primary-color: ${config.siteConfig?.themeColor || '#ec4899'};
                }
                
                .gradient-text {
                    background: linear-gradient(90deg, 
                        var(--primary-color), 
                        #a855f7, 
                        var(--primary-color));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .btn-primary {
                    background: var(--primary-color);
                    border-color: var(--primary-color);
                }

                .navbar-brand {
                    color: var(--primary-color) !important;
                }

                .badge-success, .bg-success {
                    background: linear-gradient(90deg, 
                        var(--primary-color), 
                        #a855f7) !important;
                }
            `}</style>

            {/* Dynamic Title - Can be used in header */}
            <div className="d-none">
                {config.siteConfig?.title && (
                    <span className="visually-hidden">{config.siteConfig.title}</span>
                )}
                
                {config.siteConfig?.description && (
                    <meta name="description" content={config.siteConfig.description} />
                )}
            </div>

            {/* Footer Link - If configured */}
            {config.siteConfig?.footerLink?.url && (
                <a 
                    href={config.siteConfig.footerLink.url}
                    className="text-muted small"
                >
                    {config.siteConfig.footerLink.text}
                </a>
            )}
        </React.Fragment>
    ) : null;
};

export default DynamicConfig;
