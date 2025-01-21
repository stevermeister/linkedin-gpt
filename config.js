                                                                    // API Configuration
const ENDPOINT = "https://api.openai.com/v1/chat/completions";
const MY_NAME = "Stepan Suvorov";
const MODEL = "gpt-4";
const MAX_TOKENS = 200;

// UI Constants
const UI_CONSTANTS = {
    BUTTON_TEXT: 'AI Reject',
    LOADING_TEXT: 'Loading...',
    BUTTON_STYLES: {
        marginLeft: '10px',
        padding: '8px 16px',
        backgroundColor: '#0073b1',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px'
    },
    HOVER_COLOR: '#005582',
    DEFAULT_COLOR: '#0073b1'
};

// Modal Styles
const MODAL_STYLES = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 10000
    },
    modal: {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 10001,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    input: {
        width: '100%',
        padding: '12px',
        fontSize: '14px',
        border: '1px solid #e1e9ef',
        borderRadius: '4px',
        marginBottom: '15px',
        boxSizing: 'border-box'
    },
    error: {
        color: '#d11124',
        fontSize: '14px',
        display: 'none',
        marginBottom: '15px',
        padding: '8px',
        backgroundColor: '#ffd1d1',
        borderRadius: '4px'
    },
    button: {
        padding: '10px 24px',
        fontSize: '16px',
        border: 'none',
        borderRadius: '4px',
        backgroundColor: '#0a66c2',
        color: '#fff',
        cursor: 'pointer',
        fontWeight: '600',
        width: '100%',
        marginTop: '10px'
    }
};