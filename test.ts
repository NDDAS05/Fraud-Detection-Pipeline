import { execSync } from 'child_process';

try {
  console.log('Downloading get-pip.py...');
  execSync('curl -sS https://bootstrap.pypa.io/get-pip.py -o get-pip.py', { stdio: 'inherit' });
  console.log('Installing pip...');
  execSync('python3 get-pip.py --break-system-packages', { stdio: 'inherit' });
  console.log('Installing dependencies...');
  execSync('python3 -m pip install pandas numpy scikit-learn matplotlib seaborn loguru --break-system-packages', { stdio: 'inherit' });
  console.log('Success!');
} catch (e: any) {
  console.error('Failed:', e.message);
}


