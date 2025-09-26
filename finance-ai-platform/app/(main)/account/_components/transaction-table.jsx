"use client";

import React, { useState, useMemo, useEffect } from 'react'
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Checkbox } from '@/components/ui/checkbox'
import { format } from 'date-fns';
import { categoryColors } from '@/data/categories';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Clock, MoreHorizontal, RefreshCw, ChevronDown, ChevronUp, Search, Trash, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation";
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { bulkDeleteTransactions } from '@/actions/account';
import { toast } from 'sonner';
import { BarLoader } from 'react-spinners';
import useFetch from '@/hooks/use-fetch';

const RECURRING_INTERVALS = {
    DAILY: 'Daily',
    WEEKLY: 'Weekly',
    MONTHLY: 'Monthly',
    YEARLY: 'Yearly'
};

const TransactionTable = ({ transactions }) => {
    const router = useRouter();

    const [selectedIds, setSelectedIds] = useState([]);
    const [sortConfig, setSortConfig] = useState({
        field: "date",
        direction: "desc",
    });

    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [recurringFilter, setRecurringFilter] = useState("");

    const {loading: deleteLoading, fn: deleteFn, data: deleted,} = useFetch(bulkDeleteTransactions)

    const handleBulkDelete =async () => {
        if(!window.confirm(`Are you sure you want to delete ${selectedIds.length} transactions? This action cannot be undone.`)){
            return;
        }
        deleteFn(selectedIds);
    };

    useEffect(() => {
        if(deleted && !deleteLoading){
            toast.success(`Deleted transactions Successfully`);
        }
    }, [deleted, deleteLoading]);

    const handleSort = (field) => {
        setSortConfig((current) => ({
            field,
            direction:
                current.field === field && current.direction === "asc" ? "desc" : "asc",
        }));
    };

    const handleSelect = (id) => {
        setSelectedIds((current) =>
            current.includes(id)
                ? current.filter((selectedId) => selectedId !== id)
                : [...current, id]
        );
    };

    const handleSelectAll = () => {
        setSelectedIds((current) =>
            current.length === filteredAndSortedTransactions.length
                ? []
                : filteredAndSortedTransactions.map((transaction) => transaction.id)
        );
    };

    const handleCleanFilters = () => {
        setSearchTerm("");
        setTypeFilter("");
        setRecurringFilter("");
        setSelectedIds([]);
    };

    // useMemo for filtering and sorting
    const filteredAndSortedTransactions = useMemo(() => {
        let filtered = [...transactions];

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(tx =>
                tx.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by type
        if (typeFilter) {
            filtered = filtered.filter(tx => tx.type === typeFilter);
        }

        // Filter by recurring
        if (recurringFilter === "recurring") {
            filtered = filtered.filter(tx => tx.isRecurring);
        } else if (recurringFilter === "non-recurring") {
            filtered = filtered.filter(tx => !tx.isRecurring);
        }

        // Sort
        filtered.sort((a, b) => {
            let aValue = a[sortConfig.field];
            let bValue = b[sortConfig.field];

            // If sorting by date, convert to timestamp
            if (sortConfig.field === "date") {
                aValue = new Date(aValue).getTime();
                bValue = new Date(bValue).getTime();
            }

            if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [transactions, searchTerm, typeFilter, recurringFilter, sortConfig]);

    return (
        <div className='space-y-4'>
            <BarLoader className='mt-4' color="#4A90E2" loading={deleteLoading} width="100%" />

            {/* filters */}
            <div className='flex flex-col sm:flex-row gap-4'>
                <div className='relative flex-1'>
                    <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                    <Input
                        placeholder='Search transactions...'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8" />
                </div>
                <div className='flex gap-2'>
                    <Select onValueChange={setTypeFilter} value={typeFilter} >
                        <SelectTrigger>
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="INCOME">Income</SelectItem>
                            <SelectItem value="EXPENSE">Expense</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select onValueChange={(value) => setRecurringFilter(value)} value={recurringFilter} >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="All Transactions" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="recurring">Recurring Only</SelectItem>
                            <SelectItem value="non-recurring">Non-Recurring Only</SelectItem>
                        </SelectContent>
                    </Select>

                    {selectedIds.length > 0 && (
                        <div className='flex items-center gap-2'>
                            <Button variant="destructive" size="sm" onClick={() => handleBulkDelete(selectedIds)}>
                                <Trash className='h-4 w-4 mr-2' />
                                Delete Selected ({selectedIds.length})
                            </Button>
                        </div>
                    )}

                    {(searchTerm || typeFilter || recurringFilter) && (
                        <Button variant="outline" size="icon" onClick={handleCleanFilters} title="Clear Filters">
                            <X className='h-4 w-5' />
                        </Button>
                    )}
                </div>
            </div>


            {/* transactions table */}
            <div className='rounded-md border'>
                <Table>
                    <TableCaption>A list of your recent invoices.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"><Checkbox onCheckedChange={handleSelectAll} checked={selectedIds.length === filteredAndSortedTransactions.length && filteredAndSortedTransactions.length > 0} /></TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort("date")}>
                                <div className='flex items-center'>
                                    Date{" "}
                                    {sortConfig.field === "date" && (
                                        sortConfig.direction === "asc" ? (
                                            <ChevronUp className="ml-1 h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="ml-1 h-4 w-4" />
                                        )
                                    )}
                                </div>
                            </TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort("category")}>
                                <div className='flex items-center'>
                                    Category{" "}
                                    {sortConfig.field === "category" && (
                                        sortConfig.direction === "asc" ? (
                                            <ChevronUp className="ml-1 h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="ml-1 h-4 w-4" />
                                        )
                                    )}
                                </div></TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => handleSort("amount")}>
                                <div className='flex items-center justify-end'>
                                    Amount{" "}
                                    {sortConfig.field === "amount" && (
                                        sortConfig.direction === "asc" ? (
                                            <ChevronUp className="ml-1 h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="ml-1 h-4 w-4" />
                                        )
                                    )}
                                </div></TableHead>
                            <TableHead>Recurring</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedTransactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                                    No transactions found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAndSortedTransactions.map((transaction) => (
                                <TableRow key={transaction.id} className="hover:bg-muted/50">
                                    <TableCell><Checkbox onCheckedChange={() => handleSelect(transaction.id)} checked={selectedIds.includes(transaction.id)} /></TableCell>
                                    <TableCell>{format(new Date(transaction.date), 'PP')}</TableCell>
                                    <TableCell>{transaction.description}</TableCell>
                                    <TableCell className="capitalize">
                                        <span style={{ backgroundColor: categoryColors[transaction.category] }}
                                            className="px-2 py-1 rounded text-sm text-white">
                                            {transaction.category}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-medium"
                                        style={{ color: transaction.type === 'EXPENSE' ? 'red' : 'green' }}>
                                        {transaction.type === 'EXPENSE' ? '-' : '+'}
                                        ${transaction.amount.toFixed(2)}
                                    </TableCell>
                                    <TableCell>{transaction.isRecurring ? (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Badge variant="outline"
                                                        className='gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200'>
                                                        <RefreshCw className='h-3 w-3' />
                                                        {RECURRING_INTERVALS[transaction.recurringInterval]}
                                                    </Badge>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <div>
                                                        <div>Next Date:</div>
                                                        <div>{format(new Date(transaction.nextRecurringDate), 'PP')}</div>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ) : (
                                        <Badge variant="outline" className='gap-1'><Clock className='h-3 w-3' /> One-time</Badge>
                                    )}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className='h-4 w-4' /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem
                                                    onClick={() => (
                                                        router.push(`/transaction/create?edit=${transaction.id}`)
                                                    )}
                                                >Edit</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive" onClick={() => deleteFn([transaction.id])}>Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

        </div>
    )
}

export default TransactionTable
