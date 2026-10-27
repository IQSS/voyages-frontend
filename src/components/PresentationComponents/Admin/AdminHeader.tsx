const AdminHeader = () => {
  return (
    <div style={{ margin: '10px auto', padding: '0px 15px' }}>
      <h1
        style={{
          padding: '0px 10px 5px 0px',
          margin: 0,
          fontWeight: 'bold',
          fontSize: '1.99998em',
        }}
      >
        Voyage Admin <span className="badge badge-secondary">Live</span>
      </h1>
      <h2
        style={{
          padding: 0,
          fontSize: 12,
          margin: '-6px 0 8px 0',
          fontWeight: 'normal',
          color: '#888888',
        }}
      >
        Any changes will take effect immediately
      </h2>
    </div>
  );
};
export default AdminHeader;
