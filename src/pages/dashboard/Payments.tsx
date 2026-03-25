import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    CreditCard,
    Wallet,
    Plus,
    ArrowUpRight,
    ArrowDownLeft,
    Info,
    MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useEscrow } from '@/hooks/useEscrow';
import { loadRazorpayScript, RAMDOM_KEY_ID } from '@/lib/razorpay';
import { useToast } from '@/components/ui/use-toast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

// Mock Data
// Mock Data
// Mock Payment Methods (keep for UI demo until Stripe/Razorpay saved cards are implemented)
const mockPaymentMethods: any[] = [];

const Payments = () => {
    const { user } = useAuth();
    const { transactions, loading, createEscrowTransaction, walletBalance } = useEscrow();
    const { toast } = useToast();
    const [processing, setProcessing] = useState(false);

    const handleTopUp = async () => {
        const res = await loadRazorpayScript();

        if (!res) {
            toast({
                title: "Razorpay SDK failed to load",
                variant: "destructive"
            });
            return;
        }

        const options = {
            key: RAMDOM_KEY_ID,
            amount: 50000, // 500 INR in paise
            currency: "INR",
            name: "CodeLancer",
            description: "Wallet Top Up",
            image: "https://example.com/logo.png", // Replace with logo
            handler: async function (response: any) {
                // Here you would verify signature on backend
                // For demo, we just record the transaction
                try {
                    setProcessing(true);
                    await createEscrowTransaction(500, "Wallet Top Up", undefined, undefined);
                    toast({
                        title: "Payment Successful",
                        description: `Payment ID: ${response.razorpay_payment_id}`
                    });
                } catch (error) {
                    toast({
                        title: "Transaction Failed",
                        variant: "destructive"
                    });
                } finally {
                    setProcessing(false);
                }
            },
            prefill: {
                name: user?.displayName || "User",
                email: user?.email || "user@example.com",
                contact: "9999999999"
            },
            theme: {
                color: "#3399cc"
            }
        };

        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.open();
    };
    return (
        <DashboardLayout role="developer">
            <div className="space-y-8">
                <div>
                    <h1 className="font-display text-3xl font-bold text-foreground">
                        Payments & <span className="gradient-text">Billing</span>
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your wallet, payment methods, and transaction history.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Wallet Balance Card */}
                    <Card className="md:col-span-1 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Wallet className="h-4 w-4" />
                                Wallet Balance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold font-display text-foreground">₹{walletBalance.toFixed(2)}</div>
                            <div className="flex items-center gap-2 mt-4">
                                <Button size="sm" className="w-full" onClick={handleTopUp} disabled={processing}>
                                    <Plus className="h-4 w-4 mr-2" /> {processing ? 'Processing...' : 'Top Up'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats Cards */}
                    <Card className="md:col-span-1">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Total Spent
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold font-display">₹0.00</div>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-1">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Pending In Escrow
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold font-display">₹0.00</div>
                            <p className="text-xs text-muted-foreground mt-1">0 active projects</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Transaction History */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold font-display">Transaction History</h2>
                            <Button variant="outline" size="sm" onClick={() => window.print()}>Download PDF</Button>
                        </div>

                        <div className="bg-card rounded-xl border border-border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : transactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                No transactions found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        transactions.map((trx) => (
                                            <TableRow key={trx.id}>
                                                <TableCell className="font-medium text-muted-foreground text-xs">
                                                    {trx.createdAt?.seconds ? new Date(trx.createdAt.seconds * 1000).toLocaleDateString() : 'Pending'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{trx.description}</span>
                                                        <span className="text-xs text-muted-foreground">{trx.type}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={trx.type === 'Deposit' ? 'text-green-500 font-medium' : 'text-foreground'}>
                                                        {trx.type === 'Deposit' ? '+' : '-'}₹{trx.amount.toFixed(2)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={trx.status === 'released' ? 'secondary' : 'outline'}
                                                        className={trx.status === 'released' ? 'bg-green-500/10 text-green-500' : 'text-yellow-500 border-yellow-500/30'}
                                                    >
                                                        {trx.status === 'released' ? 'Completed' : trx.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold font-display">Payment Methods</h2>
                            <Button variant="ghost" size="icon"><Plus className="h-5 w-5" /></Button>
                        </div>

                        <div className="space-y-4">
                            {mockPaymentMethods.length === 0 ? (
                                <div className="text-center p-8 border border-dashed rounded-xl bg-card">
                                    <p className="text-muted-foreground text-sm">No payment methods added</p>
                                </div>
                            ) : (
                                mockPaymentMethods.map((method) => (
                                    <div key={method.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between group hover:border-primary/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-8 bg-muted rounded flex items-center justify-center">
                                                <CreditCard className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm flex items-center gap-2">
                                                    {method.type} •••• {method.last4}
                                                    {method.isDefault && <Badge variant="secondary" className="text-[10px] h-4">Default</Badge>}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Expires {method.expiry}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}

                            <Button variant="outline" className="w-full border-dashed border-2">
                                <Plus className="h-4 w-4 mr-2" /> Add New Card
                            </Button>
                        </div>

                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Payments;
