'use client';

import React, { useState } from 'react';
import { FancyInputBox } from '../common';

const frameworksList = [
    { value: 'react', label: 'React' },
    { value: 'angular', label: 'Angular' },
    { value: 'vue', label: 'Vue' },
    { value: 'svelte', label: 'Svelte' },
];

export function Scopes() {
    const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(['react', 'angular']);

    return (
        <FancyInputBox
            options={frameworksList}
            onValueChange={setSelectedFrameworks}
            defaultValue={selectedFrameworks}
            animation={2}
        />
    );
}
