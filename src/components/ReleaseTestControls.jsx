import { appStorage } from '../services/appStorage';
import React, { useState } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import VersionHubUpdatePopup from './VersionHubUpdatePopup';
import { UPDATE_TEST_KEY } from '../services/updateTestPolicy.mjs';

export default function ReleaseTestControls() {
    const [message, setMessage] = useState('');
    const [preview, setPreview] = useState(null);
    const simulate = async action => {
        const info = Capacitor.isNativePlatform() ? await App.getInfo() : { version: '1.0.1', build: '2' };
        appStorage.setItem(UPDATE_TEST_KEY, action);
        setMessage(`Installed version: ${info.version}, build ${info.build}. Demo target: 1.0.2. No app is downloaded by this simulation.`);
        setPreview({ action, version: info.version, key: Date.now() });
    };
    return <section className="settings-card" style={{ padding: 16 }}>
        <h2>Update popup test</h2>
        <p>Test-build controls only. Optional updates allow Later; mandatory updates block the app. Reset here after dismissing the test.</p>
        <button onClick={() => simulate('optional')}>Test optional update</button>
        <button onClick={() => simulate('mandatory')}>Test mandatory update</button>
        <button onClick={() => {
            appStorage.removeItem(UPDATE_TEST_KEY);
            setPreview(null);
            setMessage('Update simulation cleared.');
        }}>Clear update test</button>
        <p role="status">{message}</p>
        {preview && <VersionHubUpdatePopup key={preview.key} testAction={preview.action} testVersion={preview.version} onTestClose={() => setPreview(null)} />}
    </section>;
}
