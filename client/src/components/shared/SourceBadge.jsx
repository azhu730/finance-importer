import { Badge } from '@fluentui/react-components';

const SOURCE_COLORS = {
  'AMEX':        'informative',
  'Venmo':       'brand',
  'Wells Fargo': 'danger',
  'Discover':    'warning',
};

export default function SourceBadge({ source }) {
  const color = SOURCE_COLORS[source] || 'subtle';
  return (
    <Badge appearance="tint" color={color} size="small">
      {source}
    </Badge>
  );
}
