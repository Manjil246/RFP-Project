export const successHealthResponse = (userName: string) => {
  return `
  <html>
    <head>
      <title>Health Check</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #4facfe, #00f2fe);
          color: #fff;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
        .container {
          background: rgba(0, 0, 0, 0.4);
          padding: 40px 60px;
          border-radius: 15px;
          text-align: center;
          box-shadow: 0 8px 20px rgba(0,0,0,0.2);
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 15px;
        }
        p {
          font-size: 1.1rem;
          opacity: 0.9;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>✅ Server is Healthy</h1>
        <p>Welcome <strong>${userName}</strong></p>
      </div>
    </body>
  </html>

  `;
};

export const errorHealthResponse = () => {
  return `
  <html>
    <head>
      <title>Health Check</title>
      <style>
        body {
          background-color: #fef2f2;
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
        }
        .container {
          text-align: center;
          background: #fee2e2;
          padding: 2rem 3rem;
          border-radius: 12px;
          box-shadow: 0 6px 15px rgba(0,0,0,0.1);
        }
        h1 {
          color: #dc2626;
          margin-bottom: 1rem;
        }
        p {
          color: #7f1d1d;
          font-size: 1.1rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>❌ Server is Unhealthy</h1>
        <p>Please check the services or try again later.</p>
      </div>
    </body>
  </html>
`;
};
