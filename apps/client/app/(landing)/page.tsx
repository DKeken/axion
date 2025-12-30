import { ROUTES } from "@/config/routes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Code2,
  Cpu,
  Database,
  ShieldCheck,
  Check,
  Terminal,
  Workflow,
  Server,
  Cloud,
  Box,
  MonitorPlay,
  Globe,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-32 pb-40 overflow-hidden px-4 md:px-0">
        <div className="container mx-auto max-w-5xl relative z-10 text-center">
          <Badge
            variant="outline"
            className="mb-8 py-2 px-4 text-sm font-medium backdrop-blur-sm bg-background/50 border-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-full"
          >
            <span className="mr-2 text-primary">★</span> Готовые микросервисы за
            минуты
          </Badge>
          <h1 className="text-5xl md:text-8xl font-bold tracking-tight mb-8 bg-gradient-to-b from-foreground via-foreground/90 to-foreground/50 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-6 duration-700 leading-[1.1]">
            Визуальная Архитектура <br /> для Современных Команд
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-8 duration-900 leading-relaxed">
            Хватит рисовать диаграммы, которые устаревают. Проектируйте,
            генерируйте и развертывайте архитектуры с полной типобезопасностью
            на едином визуальном холсте.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
            <Link href={ROUTES.DASHBOARD.PROJECTS.ROOT} passHref>
              <Button
                size="lg"
                className="rounded-full px-10 h-14 text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
              >
                Начать бесплатно <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link
              href="https://github.com/DKeken/axion"
              target="_blank"
              passHref
            >
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-10 h-14 text-lg bg-background/50 backdrop-blur border-primary/20 hover:bg-accent/50"
              >
                <GitHubIcon className="mr-2 h-5 w-5" /> GitHub
              </Button>
            </Link>
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] opacity-50 mix-blend-screen" />
          <div className="absolute top-[10%] right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] opacity-50 mix-blend-screen" />
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            От Идеи до Продакшена
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Axion Stack автоматизирует рутину бэкенд-разработки, оставляя вам
            чистый, строго типизированный код.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Step 1 */}
          <div className="group relative bg-card/50 border rounded-2xl p-8 hover:bg-accent/5 transition-colors">
            <div className="absolute -top-6 left-8 bg-background border px-4 py-1 rounded-full text-sm font-mono text-muted-foreground shadow-sm">
              ШАГ 01
            </div>
            <div className="h-12 w-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Workflow className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">
              Визуальное Проектирование
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Перетаскивайте сервисы, базы данных и очереди. Соединяйте их,
              определяя потоки данных вашей архитектуры.
            </p>
          </div>

          {/* Step 2 */}
          <div className="group relative bg-card/50 border rounded-2xl p-8 hover:bg-accent/5 transition-colors">
            <div className="absolute -top-6 left-8 bg-background border px-4 py-1 rounded-full text-sm font-mono text-muted-foreground shadow-sm">
              ШАГ 02
            </div>
            <div className="h-12 w-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Code2 className="h-6 w-6 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">Генерация Контрактов</h3>
            <p className="text-muted-foreground leading-relaxed">
              Axion автоматически создает Protobuf-контракты и
              TypeScript-интерфейсы для взаимодействия между сервисами.
            </p>
          </div>

          {/* Step 3 */}
          <div className="group relative bg-card/50 border rounded-2xl p-8 hover:bg-accent/5 transition-colors">
            <div className="absolute -top-6 left-8 bg-background border px-4 py-1 rounded-full text-sm font-mono text-muted-foreground shadow-sm">
              ШАГ 03
            </div>
            <div className="h-12 w-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Cloud className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">Мгновенное Развертывание</h3>
            <p className="text-muted-foreground leading-relaxed">
              Настраивайте инфраструктуру и развертывайте сервисы в Kubernetes
              или Docker Swarm одним нажатием.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Всё, что вам нужно
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Полный и упрощенный набор инструментов для современной
            бэкенд-разработки.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 max-w-6xl mx-auto h-auto md:h-[600px]">
          {/* Main Feature: Editor */}
          <div className="md:col-span-2 md:row-span-2 relative overflow-hidden rounded-3xl border bg-gradient-to-br from-card to-card/50 p-8 shadow-sm group">
            <div className="relative z-10 h-full flex flex-col">
              <div className="p-3 bg-primary/10 w-fit rounded-xl mb-6">
                <MonitorPlay className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Живой Редактор Графов</h3>
              <p className="text-muted-foreground text-lg mb-8 max-w-sm">
                Сердце Axion. Двунаправленный редактор реального времени,
                синхронизирующий код и архитектуру.
              </p>
              <div className="mt-auto">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Check className="h-4 w-4" /> Валидация в реальном времени
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-primary mt-2">
                  <Check className="h-4 w-4" /> Поддержка визуальных шаблонов
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-primary mt-2">
                  <Check className="h-4 w-4" /> Командная работа
                </div>
              </div>
            </div>
            {/* Abstract UI representation */}
            <div className="absolute right-[-20%] bottom-[-20%] w-[80%] h-[80%] border bg-background/50 backdrop-blur rounded-tl-3xl shadow-2xl p-4 transition-transform group-hover:translate-x-[-10px] group-hover:translate-y-[-10px]">
              <div className="flex gap-4 mb-4">
                <div className="w-24 h-24 border-2 border-primary rounded-lg flex items-center justify-center bg-card">
                  Service A
                </div>
                <div className="w-24 h-24 border-dashed border-2 border-muted-foreground rounded-lg flex items-center justify-center">
                  ...
                </div>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-primary" />
              </div>
            </div>
          </div>

          {/* Feature: Type Safety */}
          <div className="md:col-span-2 relative overflow-hidden rounded-3xl border bg-card p-8 shadow-sm group hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <div className="p-3 bg-green-500/10 w-fit rounded-xl mb-4">
                  <ShieldCheck className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  Сквозная Типобезопасность
                </h3>
                <p className="text-muted-foreground text-sm">
                  Измените контракт на графе и увидите, как ошибки типов
                  мгновенно распространяются по сервисам.
                </p>
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-mono bg-muted p-3 rounded-lg border text-muted-foreground">
                  interface User {"{"} <br />
                  &nbsp;&nbsp;id: string; <br />
                  &nbsp;&nbsp;role: Role; <br />
                  {"}"}
                </div>
              </div>
            </div>
          </div>

          {/* Feature: IaC */}
          <div className="relative overflow-hidden rounded-3xl border bg-card p-8 shadow-sm group hover:border-orange-500/50 transition-colors">
            <div className="p-3 bg-orange-500/10 w-fit rounded-xl mb-4">
              <Server className="h-6 w-6 text-orange-500" />
            </div>
            <h3 className="text-lg font-bold mb-2">Инфраструктура как Код</h3>
            <p className="text-muted-foreground text-sm">
              Автоматическая генерация файлов Terraform и Docker Compose.
            </p>
          </div>

          {/* Feature: Multi-language */}
          <div className="relative overflow-hidden rounded-3xl border bg-card p-8 shadow-sm group hover:border-blue-500/50 transition-colors">
            <div className="p-3 bg-blue-500/10 w-fit rounded-xl mb-4">
              <Globe className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold mb-2">Мультиязычность</h3>
            <p className="text-muted-foreground text-sm">
              Создавайте сервисы на Go, Node.js (TS), Python или Rust.
            </p>
          </div>
        </div>
      </section>

      {/* Tech Stack Strip */}
      <section className="py-12 border-y bg-accent/20">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-8">
            Качество генерируемого стека
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
            <TechLogos />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Простые и Прозрачные Тарифы
        </h2>
        <p className="text-muted-foreground text-lg mb-16">
          Начните бесплатно, обновляйтесь по мере роста.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <Card className="flex flex-col text-left">
            <CardHeader>
              <CardTitle className="text-xl">Hobby</CardTitle>
              <CardDescription>Идеально для пет-проектов.</CardDescription>
              <div className="text-4xl font-bold mt-4">
                $0{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  /мес
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" /> 1 Проект
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" /> 5 Сервисов /
                  Проект
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" /> Локальное
                  приложение
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" /> Поддержка
                  сообщества
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline">
                Начать
              </Button>
            </CardFooter>
          </Card>

          {/* Pro Tier */}
          <Card className="flex flex-col text-left border-primary shadow-lg relative">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg font-medium">
              ПОПУЛЯРНОЕ
            </div>
            <CardHeader>
              <CardTitle className="text-xl">Pro</CardTitle>
              <CardDescription>
                Для растущих команд и стартапов.
              </CardDescription>
              <div className="text-4xl font-bold mt-4">
                $29{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  /мес
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-primary" /> Безлимитные
                  проекты
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-primary" /> Безлимитные
                  сервисы
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-primary" /> Cloud
                  Deployment (AWS/GCP)
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-primary" /> Продвинутая
                  генерация кода
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-primary" /> Приоритетная
                  поддержка
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Попробовать</Button>
            </CardFooter>
          </Card>

          {/* Enterprise Tier */}
          <Card className="flex flex-col text-left">
            <CardHeader>
              <CardTitle className="text-xl">Enterprise</CardTitle>
              <CardDescription>Для крупных организаций.</CardDescription>
              <div className="text-4xl font-bold mt-4">Custom</div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" /> On-Premise
                  развертывание
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" /> SSO / SAML
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" /> Кастомные
                  шаблоны
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" /> 24/7 SLA
                  поддержка
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline">
                Связаться с нами
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Частые Вопросы</h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Кому принадлежит код?</AccordionTrigger>
            <AccordionContent>
              Да, абсолютно. Код, сгенерированный Axion Stack, является
              стандартным, человекочитаемым бойлерплейтом (NestJS, Go и т.д.),
              который полностью принадлежит вам. Вы можете &laquo;извлечь&raquo;
              проект из Axion в любой момент.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>
              Какие базы данных поддерживаются?
            </AccordionTrigger>
            <AccordionContent>
              В настоящее время мы поддерживаем PostgreSQL, MySQL, Redis и
              MongoDB. Мы постоянно добавляем поддержку новых технологий.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>
              Можно ли импортировать существующие проекты?
            </AccordionTrigger>
            <AccordionContent>
              Импорт существующих микросервисов, написанных вручную, находится в
              наших планах. В настоящее время Axion лучше всего подходит для
              новых проектов или крупных новых фич.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>Это Open Source?</AccordionTrigger>
            <AccordionContent>
              Ядро Axion Stack является открытым (Open Source). Вы можете
              развернуть стандартную версию самостоятельно. Pro-функции, такие
              как продвинутое управление облаком и командами, доступны в хостед
              версии или enterprise лицензии.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 text-center py-20">
        <div className="max-w-4xl mx-auto p-16 rounded-[2.5rem] bg-gradient-to-b from-primary/10 to-transparent border relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute top-0 left-0 w-full h-full -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">
            Готовы спроектировать будущее?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Присоединяйтесь к тысячам разработчиков, создающих масштабируемые
            системы с Axion Stack.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href={ROUTES.DASHBOARD.PROJECTS.ROOT} passHref>
              <Button size="lg" className="rounded-full px-12 h-14 text-lg">
                Начать сейчас
              </Button>
            </Link>
            <Link href="/contact" passHref>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-12 h-14 text-lg"
              >
                Связаться с нами
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function TechLogos() {
  return (
    <>
      <div className="flex items-center gap-2 font-bold text-xl">
        <Terminal className="w-6 h-6" /> CLI
      </div>
      <div className="flex items-center gap-2 font-bold text-xl">
        <Box className="w-6 h-6" /> Docker
      </div>
      <div className="flex items-center gap-2 font-bold text-xl">
        <Database className="w-6 h-6" /> Postgres
      </div>
      <div className="flex items-center gap-2 font-bold text-xl">
        <Cpu className="w-6 h-6" /> NestJS
      </div>
      <div className="flex items-center gap-2 font-bold text-xl">
        <ActivityIcon className="w-6 h-6" /> Go
      </div>
    </>
  );
}

function GitHubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
