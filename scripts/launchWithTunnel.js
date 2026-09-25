import { createServer } from 'vite';
import localtunnel from 'localtunnel';
import http from 'http';
import qrcode from 'qrcode';

async function main() {
  console.log('\n=============================================================');
  console.log('  🇸🇬 PSLE 小六华文闪卡短视频生成器 (Outside Public Access)  ');
  console.log('=============================================================\n');

  console.log('⏳ 1. 正在启动本地服务器 (Port 5173)...');
  const server = await createServer({
    server: { port: 5173, host: true }
  });
  await server.listen();
  console.log('✅ 本地服务已就绪: http://localhost:5173');

  // Get external IP
  let publicIp = '122.11.212.93';
  try {
    const res = await fetch('https://api.ipify.org');
    publicIp = (await res.text()).trim();
  } catch (e) {}

  console.log('⏳ 2. 正在开通安全外网访问隧道 (Public Tunnel)...');
  const tunnel = await localtunnel({ port: 5173 });

  console.log('\n=============================================================');
  console.log(`🌐 外网访问公网网址 (Public URL): \x1b[32m${tunnel.url}\x1b[0m`);
  console.log(`🔑 首次外网打开如果提示 Password/IP，请输入: \x1b[33m${publicIp}\x1b[0m`);
  console.log('=============================================================\n');

  console.log('📱 无论您的手机在何处（使用 4G/5G 移动蜂窝网络，还是外部其他 Wi-Fi）：');
  console.log(`直接在手机浏览器打开: ${tunnel.url}\n`);

  tunnel.on('close', () => {
    console.log('Tunnel closed.');
  });
}

main().catch(console.error);
