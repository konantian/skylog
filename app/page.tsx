import Atlas from '@/components/atlas';
import {LocaleProvider} from '@/components/locale-provider';
export default function Page() { return <LocaleProvider><Atlas/></LocaleProvider>; }
