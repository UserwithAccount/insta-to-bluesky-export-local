# Insta-to-Bluesky Export

This project allows you to manage and export scheduled posts from a database to Bluesky.

## Environment Variables

To run this project, you need to create a `.env` file in the root of your project and define the following environment variables:

### Required Variables

| Variable Name            | Description                                                                 | Example Value                          |
|---------------------------|-----------------------------------------------------------------------------|----------------------------------------|
| `DATABASE_URL`           | The connection URL for your database.                                       | `postgresql://user:password@host:port/database` |
| `BASE_URL`               | The base URL of your application.                                           | `http://localhost:3000`               |
| `BLUESKY_SERVICE`        | The URL of the Bluesky service.                                             | `https://bsky.social`                 |
| `CREDENTIAL_SECRET_KEY`  | A secret key used for encrypting sensitive data. Generate one using:        | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NEXT_PUBLIC_BASE_URL`   | The public base URL of your application (used in the frontend).             | `http://localhost:3000`               |
| `AUTH_USERNAME`          | The username for accessing protected routes or admin features.             | `admin`                               |
| `AUTH_PASSWORD`          | The password for accessing protected routes or admin features.             | `supersecret`                         |

```properties ```
DATABASE_URL="postgresql://user:password@host:port/database"
BASE_URL="http://localhost:3000"
BLUESKY_SERVICE="https://bsky.social"
CREDENTIAL_SECRET_KEY="fa07b86b7fc272312671e105a01fff3ac8fbf8ce2baceccfd99be23134b94001"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
AUTH_USERNAME="admin"
AUTH_PASSWORD="supersecret"

## Getting Started

### Prerequisites

## How to Retrieve Your Instagram Posts

To export your Instagram posts and use them in this project, follow these steps:

1. **Request Your Instagram Data**:
   - Log in to your Instagram account on the [Instagram website](https://www.instagram.com/).
   - Go to your **Profile** and click on the **Settings** (gear icon).
   - Navigate to **Account Overview** > **Your Information and permissions** > **Download your information**.
   - Click **Request Download** , choose just "media" and the relevant time and choose the format as `JSON` (and quality "high" if possible!).
   - Enter your email address and Instagram password if necessary to confirm the request.

2. **Download the Data**:
   - Instagram will send you an email with a link to download your data. This may take a few minutes to several hours or even days, depending on the size of your account.
   - Click the link in the email and download the `.zip` file containing your data.

3. **Extract the Data**:
   - Unzip the downloaded file. Inside, you’ll find two folder, 
   1. "your_instagram_activity" containing multiple `.json` files.
      - Look for the file named `posts_1.json` or similar, which contains information about your posts.
   2. "media", which holds all content from you, especially in the posts folder

## Notes
- Instagram data is personal and sensitive. Keep the downloaded files secure and avoid sharing them publicly.
- If you encounter issues with the data format, refer to the [Instagram Data API documentation](https://developers.facebook.com/docs/instagram-api/) for additional guidance.


## Make sure you have the following installed on your system:
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/insta-to-bluesky-export.git
   cd insta-to-bluesky-export
   use the "local-app" branch when you want to deploy locally!
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory and add the required environment variables as described above.

### Running the Development Server

Start the development server with one of the following commands:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Features

- **Post Management**: View, edit, and delete scheduled posts from the database.
- **Bluesky Integration**: Send posts directly to Bluesky.
- **Week Grouping**: Posts are grouped by the week they are scheduled for.
- **Responsive Design**: Optimized for both desktop and mobile devices.

## Folder Structure

```
.
├── app/                # Application logic and components
├── lib/                # Utility libraries (e.g., Prisma, Supabase)
├── pages/              # Next.js pages
├── public/             # Static assets
├── prisma/             # Prisma schema and migrations
├── .env                # Environment variables
└── README.md           # Project documentation
```

## Deployment

To deploy this project, follow these steps:

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```


## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature-name`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/your-feature-name`).
5. Open a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Supabase](https://supabase.com/)
- [Bluesky](https://bsky.app/)
