# VAPR - Video Analytics Pro Recorder

A modern, local-only IP camera recorder application built with Next.js App Router. Features a sleek dark interface inspired by [contrastio/recorder](https://github.com/contrastio/recorder) for viewing live RTSP streams via HLS and recording them to MP4 files.

## Features

- 🎥 **Multiple IP Cameras** - Connect multiple RTSP cameras simultaneously
- 📺 **Live HLS Streaming** - Browser-based live preview using HLS.js
- 🔴 **One-Click Recording** - Animated record button with visual feedback
- ⏱️ **Recording Duration** - Real-time stopwatch showing recording time
- 📁 **Timestamped Files** - Recordings saved as MP4 with automatic timestamps
- 🎨 **Modern Dark UI** - Clean interface inspired by contrastio/recorder
- 🔒 **100% Local** - No cloud services, everything runs on your machine
- ⚡ **Stream All** - Start all camera streams with one click
- 🎬 **Record All** - Record all cameras simultaneously

## Prerequisites

### FFmpeg Installation

FFmpeg must be installed and available in your system PATH.

**Windows (using Chocolatey):**

```powershell
choco install ffmpeg
```

**Windows (using Scoop):**

```powershell
scoop install ffmpeg
```

**Windows (Manual):**

1. Download from https://ffmpeg.org/download.html
2. Extract to `C:\ffmpeg`
3. Add `C:\ffmpeg\bin` to your system PATH

**Verify installation:**

```bash
ffmpeg -version
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure your cameras

Edit `lib/config.ts` to add your IP cameras:

```typescript
export const cameras: CameraConfig[] = [
  {
    id: "camera-1",
    name: "Front Door",
    rtspUrl: "rtsp://admin:password@192.168.1.100:554/stream",
  },
  {
    id: "camera-2",
    name: "Back Yard",
    rtspUrl: "rtsp://admin:password@192.168.1.101:554/stream",
  },
];
```

### 3. Run the development server

```bash
npm run dev
```

### 4. Open in browser

Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
verve-recorder/
├── app/
│   ├── api/
│   │   ├── cameras/
│   │   │   ├── route.ts              # GET /api/cameras - List all cameras
│   │   │   └── [id]/
│   │   │       ├── stream/
│   │   │       │   ├── start/route.ts # POST - Start HLS stream
│   │   │       │   └── stop/route.ts  # POST - Stop HLS stream
│   │   │       └── record/
│   │   │           ├── start/route.ts # POST - Start recording
│   │   │           └── stop/route.ts  # POST - Stop recording
│   │   └── status/
│   │       └── route.ts              # GET /api/status - All active processes
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                      # Main page with camera grid
├── components/
│   ├── CameraCard.tsx                # Individual camera card with controls
│   ├── CameraGrid.tsx                # Grid of all cameras
│   └── HlsPlayer.tsx                 # HLS video player component
├── lib/
│   ├── config.ts                     # Camera configuration
│   ├── ffmpeg-manager.ts             # FFmpeg process management
│   └── types.ts                      # TypeScript types
├── public/
│   └── streams/                      # HLS stream segments (auto-generated)
│       └── [camera-id]/
│           ├── stream.m3u8           # HLS playlist
│           └── segment*.ts           # Video segments
└── recordings/                       # MP4 recordings (auto-generated)
    └── [camera-id]/
        └── YYYY-MM-DD_HH-mm-ss.mp4   # Timestamped recordings
```

## FFmpeg Commands Reference

### HLS Live Streaming (RTSP → HLS)

The application uses this command for live preview:

```bash
ffmpeg \
  -rtsp_transport tcp \
  -i "rtsp://admin:password@192.168.1.100:554/stream" \
  -c:v libx264 \
  -preset ultrafast \
  -tune zerolatency \
  -g 30 \
  -c:a aac \
  -ar 44100 \
  -b:a 128k \
  -f hls \
  -hls_time 2 \
  -hls_list_size 5 \
  -hls_flags delete_segments+append_list \
  -hls_segment_filename "public/streams/camera-1/segment%03d.ts" \
  "public/streams/camera-1/stream.m3u8"
```

**Options explained:**

- `-rtsp_transport tcp`: Use TCP for reliable RTSP transport
- `-c:v libx264`: Transcode to H.264 for browser compatibility
- `-preset ultrafast`: Fast encoding with low CPU usage
- `-tune zerolatency`: Optimize for low-latency streaming
- `-g 30`: Keyframe interval (1 second at 30fps)
- `-hls_time 2`: Each segment is 2 seconds
- `-hls_list_size 5`: Keep 5 segments in playlist
- `-hls_flags delete_segments`: Auto-cleanup old segments

### Recording (RTSP → MP4)

The application uses this command for recording:

```bash
ffmpeg \
  -rtsp_transport tcp \
  -i "rtsp://admin:password@192.168.1.100:554/stream" \
  -c copy \
  -movflags +faststart \
  -err_detect ignore_err \
  -fflags +genpts \
  "recordings/camera-1/2024-01-15_14-30-00.mp4"
```

**Options explained:**

- `-c copy`: Copy streams without re-encoding (best quality, low CPU)
- `-movflags +faststart`: Move metadata for web streaming
- `-err_detect ignore_err`: Continue on stream errors
- `-fflags +genpts`: Generate timestamps if missing

### Common RTSP URL Formats

| Brand         | URL Format                                                     |
| ------------- | -------------------------------------------------------------- |
| **Generic**   | `rtsp://user:pass@IP:554/stream`                               |
| **Hikvision** | `rtsp://admin:pass@IP:554/Streaming/Channels/101`              |
| **Dahua**     | `rtsp://admin:pass@IP:554/cam/realmonitor?channel=1&subtype=0` |
| **Reolink**   | `rtsp://admin:pass@IP:554/h264Preview_01_main`                 |
| **Amcrest**   | `rtsp://user:pass@IP:554/cam/realmonitor?channel=1&subtype=1`  |
| **Uniview**   | `rtsp://admin:pass@IP:554/unicast/c1/s0/live`                  |

## API Endpoints

| Method | Endpoint                         | Description                      |
| ------ | -------------------------------- | -------------------------------- |
| GET    | `/api/cameras`                   | List all cameras with status     |
| POST   | `/api/cameras/[id]/stream/start` | Start HLS stream for camera      |
| POST   | `/api/cameras/[id]/stream/stop`  | Stop HLS stream for camera       |
| POST   | `/api/cameras/[id]/record/start` | Start recording for camera       |
| POST   | `/api/cameras/[id]/record/stop`  | Stop recording for camera        |
| GET    | `/api/status`                    | List all active FFmpeg processes |

## Troubleshooting

### Stream not loading

1. Check FFmpeg is installed: `ffmpeg -version`
2. Verify RTSP URL is correct (test with VLC)
3. Check camera is accessible on network
4. Look at terminal/console for FFmpeg errors

### Recording file is corrupt

- Make sure to click "Stop Recording" before closing the app
- The app sends SIGINT to FFmpeg for proper file finalization

### High CPU usage

- The HLS stream uses `libx264` for transcoding
- For lower CPU, edit `ffmpeg-manager.ts` and change `-c:v libx264` to `-c:v copy` (if camera outputs H.264)

### Streams folder permissions

- Ensure the app has write access to `public/streams/` and `recordings/`

## Production Considerations

1. **Process persistence**: FFmpeg processes run as long as the Node.js server runs
2. **Graceful shutdown**: The app handles SIGTERM/SIGINT to stop all FFmpeg processes
3. **Disk space**: Monitor `recordings/` folder size; consider periodic cleanup
4. **Multiple cameras**: Each camera spawns separate FFmpeg processes for streaming and recording
5. **Network bandwidth**: Each camera stream uses ~2-5 Mbps depending on resolution

## License

MIT
