import { Text, makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  card: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    padding: '10px 14px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  label: {
    display: 'block',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginBottom: '2px',
  },
  value: {
    display: 'block',
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
  },
});

export default function StatCard({ label, value, color }) {
  const s = useStyles();
  return (
    <div className={s.card}>
      <Text className={s.label}>{label}</Text>
      <Text className={s.value} style={{ color }}>{value}</Text>
    </div>
  );
}
