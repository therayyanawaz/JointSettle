'use client'
import { useAnalytics } from '@/components/track-page'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useLocalStorageState, useMediaQuery } from '@/lib/hooks'
import { GitHubLogoIcon } from '@radix-ui/react-icons'
import {
  BarChart,
  DollarSign,
  ExternalLink,
  Globe,
  LucideIcon,
  Newspaper,
  Receipt,
  Repeat,
  Smartphone,
  Sparkles,
  Tags,
  Wand,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'

type News = {
  id: string
  title: JSX.Element
  summary: JSX.Element
  content: JSX.Element
  icon: LucideIcon
}

const news: News[] = [
  {
    id: 'multi-currency',
    title: <>Multi-currency with live exchange rates</>,
    summary: (
      <>
        Expenses now support 170+ currencies with automatic live exchange rate
        conversion powered by the Frankfurter API.
      </>
    ),
    icon: DollarSign,
    content: (
      <>
        <p>
          You can now record expenses in any currency and JointSettle will
          automatically convert them using live exchange rates.
        </p>
        <p>
          Each expense can have its own currency, and the conversion rate is
          automatically fetched based on the expense date. Historical exchange
          rates are supported too — perfect for trips abroad.
        </p>
      </>
    ),
  },
  {
    id: 'stats-dashboard',
    title: <>Stats dashboard &amp; charts</>,
    summary: (
      <>
        Mini dashboard with spending overview, plus pie charts and bar charts
        for detailed group analytics.
      </>
    ),
    icon: BarChart,
    content: (
      <>
        <p>
          The expenses page now includes a mini dashboard showing total spend,
          your spending, your balance, and your share at a glance — all with
          animated counters and beautiful card layouts.
        </p>
        <p>
          Head to the Stats page for detailed pie charts by category and bar
          charts by participant, helping you see exactly where the money is
          going.
        </p>
      </>
    ),
  },
  {
    id: 'categories',
    title: <>100+ expense categories</>,
    summary: (
      <>
        Rich categorization with 100+ categories across 12 groupings — Housing,
        Food &amp; Dining, Shopping, Travel, and more.
      </>
    ),
    icon: Tags,
    content: (
      <>
        <p>
          JointSettle now features 100+ categories across 12 groupings
          including Housing, Transportation, Food &amp; Dining, Shopping,
          Entertainment, Travel, Healthcare, Education, Income, and more.
        </p>
        <p>
          Categories help you organize expenses and power the analytics and
          charts for better spending insights.
        </p>
      </>
    ),
  },
  {
    id: 'recurring-expenses',
    title: <>Recurring expenses</>,
    summary: (
      <>
        Set daily, weekly, or monthly recurring expenses for regular bills and
        subscriptions.
      </>
    ),
    icon: Repeat,
    content: (
      <p>
        You can now set expenses to repeat daily, weekly, or monthly. Perfect
        for rent, subscriptions, utilities, and other regular bills. The
        expense is automatically recreated on the schedule you set.
      </p>
    ),
  },
  {
    id: 'languages',
    title: <>JointSettle is now available in 23+ languages!</>,
    summary: (
      <>
        French, German, Spanish, Japanese, and more! Read about it in our blog
        post.
      </>
    ),
    icon: Globe,
    content: (
      <>
        <p>
          JointSettle began as an English-only app but now supports 23+
          languages, thanks to the open-source community. Learn about the
          contributors and how to help expand language support.
        </p>
        <p>
          <Button asChild>
            <a
              target="_blank"
              href="/blog/spliit-is-now-available-in-eight-languages"
              className="no-underline"
            >
              <ExternalLink className="mr-2 w-4" />
              Read the blog post
            </a>
          </Button>
        </p>
      </>
    ),
  },
  {
    id: 'scan-receipts',
    title: <>Scan receipts to create expenses</>,
    summary: <>Create expenses faster by taking a photo of a receipt!</>,
    icon: Wand,
    content: (
      <>
        <p>
          Now, instead of entering all your expense information manually, you
          can save time by taking a photo of a receipt. JointSettle will use AI
          to extract information from it and fill the expense.
        </p>
        <p>
          <Image
            src={require('../../public/receipt-scanning-screenshot.png')}
            alt="Receipt scanning feature screenshot"
          />
        </p>
        <p>
          <Button asChild>
            <Link
              href="/blog/announcing-receipt-scanning-using-ai"
              target="_blank"
              className="no-underline"
            >
              Read announcement
            </Link>
          </Button>
        </p>
      </>
    ),
  },
  {
    id: 'receipts',
    title: <>Attach receipts to expenses</>,
    summary: <>You can now upload images to each of your expenses!</>,
    icon: Receipt,
    content: (
      <>
        <p>
          Now, when you create or update an expense, you can attach images. Use
          this feature to attach receipts and show your friends why the expense
          is here.
        </p>
        <p>
          <Image
            src={require('../../public/receipt-screenshot.png')}
            alt="Receipt feature screenshot"
          />
        </p>
      </>
    ),
  },
  {
    id: 'pwa',
    title: <>Install JointSettle as an app</>,
    summary: (
      <>
        JointSettle is now a Progressive Web App — install it on your device
        for a native-like experience.
      </>
    ),
    icon: Smartphone,
    content: (
      <p>
        JointSettle is now a Progressive Web App (PWA). You can install it on
        your phone, tablet, or desktop for a native-like experience — including
        a home screen icon and offline support.
      </p>
    ),
  },
  {
    id: 'transparency-post',
    title: <>How much does JointSettle cost?</>,
    summary: (
      <>
        A new blog post covering how much JointSettle’s hosting costs and how
        much people donate.
      </>
    ),
    icon: Newspaper,
    content: (
      <>
        <p>
          JointSettle has grown to 152k visitors, with community donations
          helping cover its hosting costs. Explore its usage trends, funding,
          and the contributors driving its development.
        </p>
        <p>
          <Button asChild>
            <a
              target="_blank"
              href="/blog/spliit-by-the-stats-usage-costs-donations"
              className="no-underline"
            >
              <ExternalLink className="mr-2 w-4" />
              Read the blog post
            </a>
          </Button>
        </p>
      </>
    ),
  },
]

export function NewsButton() {
  const [openNews, setOpenNews] = useState<News | null>(null)

  const [ping, setPing] = useState(false)
  const [alreadySeen, setAlreadySeen, alreadySeenLoaded] = useLocalStorageState<
    string[] | null
  >('already-seen-news', null)

  const isDesktop = useMediaQuery('(min-width: 640px)')

  useEffect(() => {
    if (alreadySeenLoaded) {
      setPing(news.some((news) => !alreadySeen?.includes(news.id)))
    }
  }, [alreadySeenLoaded, alreadySeen])

  const sendEvent = useAnalytics()

  return (
    <>
      <div className="">
        {ping && (
          <span className="relative float-right -ml-3 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75"></span>
            <span className="relative inline-flex h-full w-full rounded-full bg-pink-600"></span>
          </span>
        )}
        <Popover
          onOpenChange={(open) => {
            if (open) {
              sendEvent({ event: 'news: open menu', props: {} })
              setAlreadySeen(news.map((newsItem) => newsItem.id))
              setPing(false)
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" className="text-primary">
              <Sparkles className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="mx-2 w-[22rem] sm:w-[30rem]">
            <h2 className="mb-3 border-b px-3 pb-2 font-bold">
              Latest updates
            </h2>
            <ul>
              {news.map((newsItem) => (
                <li key={newsItem.id}>
                  <NewsListItem
                    news={newsItem}
                    onClick={() => {
                      sendEvent({
                        event: 'news: click news',
                        props: { news: newsItem.id },
                      })
                      setOpenNews(newsItem)
                    }}
                  />
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      </div>
      {openNews !== null &&
        (isDesktop ? (
          <NewsDialog openNews={openNews} setOpenNews={setOpenNews} />
        ) : (
          <NewsDrawer openNews={openNews} setOpenNews={setOpenNews} />
        ))}
    </>
  )
}

function NewsDialog({
  openNews,
  setOpenNews,
}: {
  openNews: News
  setOpenNews: Dispatch<SetStateAction<News | null>>
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          setOpenNews(null)
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{openNews.title}</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <div className="prose dark:prose-invert [&_img]:shadow-lg">
          {openNews.content}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function NewsDrawer({
  openNews,
  setOpenNews,
}: {
  openNews: News
  setOpenNews: Dispatch<SetStateAction<News | null>>
}) {
  return (
    <Drawer
      open
      onOpenChange={(open) => {
        if (!open) {
          setOpenNews(null)
        }
      }}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{openNews.title}</DrawerTitle>
          <DrawerDescription></DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4 prose dark:prose-invert  [&_img]:shadow-lg">
          {openNews.content}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function NewsListItem({ news, onClick }: { news: News; onClick?: () => void }) {
  const Icon = news.icon
  return (
    <button
      className="flex rounded-md text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 p-3 gap-3 w-full"
      onClick={(event) => {
        event.preventDefault()
        onClick?.()
      }}
    >
      <div className="flex-shrink-0 p-1">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 flex-col">
        <h3 className="mb-1 font-bold">{news.title}</h3>
        <div className="prose-sm dark:prose-invert">
          <p className="line-clamp-2">{news.summary}</p>
        </div>
      </div>
    </button>
  )
}
