import { Button, CopyToClipboard } from '@revertdotdev/components';
import { inter } from '@revertdotdev/fonts';
import { setOnboardingCompleted } from '@revertdotdev/lib/actions';
import { sdkContent } from '@revertdotdev/lib/constants';
import { useRouter } from 'next/navigation';

function FrontendSDKContent({ value, userId, environment }: { value: string; userId: string; environment: string }) {
    const router = useRouter();
    return (
        <div>
            <div className="mb-3">
                <div className="mb-4 flex justify-between items-center">
                    <div>
                        <h1 className={`${inter.className} mb-1 text-lg font-medium`}>Getting Started</h1>
                        <p className="text-gray-50 text-sm">In your frontend, install the npm package</p>
                    </div>
                </div>
                <CopyToClipboard value={sdkContent[value].command} />
            </div>
            <div className="mb-3">
                <div className="mb-4 flex justify-between items-center">
                    <div>
                        <h1 className={`${inter.className} mb-1 text-lg font-medium`}>Usage</h1>
                        <p className="text-gray-50 text-sm">
                            1. Adding the {'<'}
                            <span>RevertConnect</span>
                            {'>'} component will instantly give your app a way for your users to connect their tools by
                            opening our Modal on clicking where they will be a able to choose & connect their 3rd party
                            tool.
                        </p>
                    </div>
                </div>
                <CopyToClipboard value={sdkContent[value].step1} height={value === 'react' ? '25vh' : '52vh'} />
            </div>
            <div className="mb-3">
                <p className="text-gray-50 text-sm mb-1">
                    2. If you wish to use your own UI for it you can use the useRevertConnnect hook and call
                    the open() method when appropriate. For example:
                </p>
                <CopyToClipboard value={sdkContent[value].step2} height={value === 'react' ? '43vh' : '53vh'} />
            </div>
            <div>
                <p className="text-gray-50 text-sm">
                    3. Make a connection to integration and start calling revert unified endpoints
                </p>
            </div>
            <div className="flex justify-end">
                <Button
                    type="submit"
                    onClick={async () => {
                        await setOnboardingCompleted({
                            userId,
                            environment,
                        });
                        router.push('/dashboard');
                    }}
                >
                    <span>Complete</span>
                </Button>
            </div>
        </div>
    );
}

export default FrontendSDKContent;
