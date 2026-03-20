import { Button, Text, makeStyles, tokens } from '@fluentui/react-components';
import { DismissRegular } from '@fluentui/react-icons';
import SourceBadge from './SourceBadge.jsx';

const useStyles = makeStyles({
  chip: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '6px 10px',
  },
  name: {
    flex: 1,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  count: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    flexShrink: 0,
  },
});

export default function FileChip({ file, onRemove }) {
  const s = useStyles();
  return (
    <div className={s.chip}>
      <SourceBadge source={file.source} />
      <Text className={s.name} title={file.name}>{file.name}</Text>
      <Text className={s.count}>{file.count} rows</Text>
      <Button
        appearance="subtle"
        size="small"
        icon={<DismissRegular style={{ fontSize: 12 }} />}
        onClick={onRemove}
        style={{ minWidth: 0, padding: '2px' }}
      />
    </div>
  );
}
