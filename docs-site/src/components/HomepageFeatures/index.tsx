import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  icon: string;
  description: ReactNode;
  link: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'PRD说明',
    icon: '📋',
    description: (
      <>
        产品需求文档，包含详细的功能需求、用户故事和验收标准。
        了解产品的核心功能和设计理念。
      </>
    ),
    link: '/docs/prd',
  },
  {
    title: 'UI说明',
    icon: '🎨',
    description: (
      <>
        UI设计规范，包含组件规范、颜色主题、交互规范等。
        为前端开发提供统一的设计标准。
      </>
    ),
    link: '/docs/ui-spec',
  },
  {
    title: '技术说明',
    icon: '💻',
    description: (
      <>
        技术架构、功能实现清单、技术选型说明和核心逻辑说明。
        深入了解技术实现细节和算法原理。
      </>
    ),
    link: '/docs/tech-spec',
  },
];

function Feature({title, icon, description, link}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <div style={{fontSize: '4rem', marginBottom: '1rem'}}>{icon}</div>
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
        <Link
          className="button button--secondary button--outline"
          to={link}>
          查看详情 →
        </Link>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
