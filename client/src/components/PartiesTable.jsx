import React from 'react';

export default function PartiesTable({ parties }) {
  const partyList = Array.isArray(parties) ? parties : [];

  if (partyList.length === 0) {
    return (
      <div className="section-card">
        <div className="card-header">
          <h2 className="card-title">Parties and roles</h2>
          <span className="card-eyebrow">Litigants</span>
        </div>
        <p className="not-found">No party details identified in the extracted text.</p>
      </div>
    );
  }

  return (
    <div className="section-card">
      <div className="card-header">
        <h2 className="card-title">Parties and roles</h2>
        <span className="card-eyebrow">Litigants</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="parties-table">
          <thead>
            <tr>
              <th style={{ width: '38%' }}>Party Name</th>
              <th style={{ width: '22%' }}>Role</th>
              <th>Context / Notes</th>
            </tr>
          </thead>
          <tbody>
            {partyList.map((p, idx) => (
              <tr key={idx}>
                <td><strong>{p.name || 'Name unclear'}</strong></td>
                <td>
                  <span className="role-badge">
                    {p.role || 'Role unclear'}
                  </span>
                </td>
                <td style={{ color: 'var(--ink-700)' }}>
                  {p.notes || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
