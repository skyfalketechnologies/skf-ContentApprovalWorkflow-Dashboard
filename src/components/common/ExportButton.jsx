import { useState } from 'react'

export function ExportButton({ title, body }) {
  const [showOptions, setShowOptions] = useState(false)

  const exportAsTxt = () => {
    const content = `${title}\n\n${body}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
    setShowOptions(false)
  }

  const exportAsMd = () => {
    const content = `# ${title}\n\n${body}`
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.md`
    a.click()
    URL.revokeObjectURL(url)
    setShowOptions(false)
  }

  const copyToClipboard = async () => {
    const content = `${title}\n\n${body}`
    await navigator.clipboard.writeText(content)
    alert('Content copied to clipboard!')
    setShowOptions(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowOptions(!showOptions)}
        style={{
          padding: '6px 12px',
          backgroundColor: '#22c55e',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        📥 Export
      </button>
      {showOptions && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '4px',
          backgroundColor: 'white',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          zIndex: 10,
          minWidth: '150px'
        }}>
          <button
            onClick={exportAsTxt}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 16px',
              textAlign: 'left',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            Export as .txt
          </button>
          <button
            onClick={exportAsMd}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 16px',
              textAlign: 'left',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            Export as .md
          </button>
          <button
            onClick={copyToClipboard}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 16px',
              textAlign: 'left',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              borderTop: '1px solid #e2e8f0'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            Copy to clipboard
          </button>
        </div>
      )}
    </div>
  )
}