import { AppDock } from '@/components/navigation/AppDock';
import ConsolePage from './ConsolePage';
import { cn } from '@/lib/utils';
import DotPattern from '@/components/ui/dot-pattern';


export default function App() {
    return (
        <>
            <AppDock />
            <ConsolePage />
        </>
    );
}